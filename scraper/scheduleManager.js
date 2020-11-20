const paths = require('../paths');
const schedule = require('node-schedule');
const clusterManager = require('./clusterManager');
const Automation = require(paths.path_app_models+'automation');
const writeLog = require('./writeLog');
const fs = require('fs');
const moment = require('moment');
const sendMail = require('./sendMail');
const { Cluster } = require('puppeteer-cluster');
const getMosaic = require('./getMosaic');
const getRoulezEco = require('./getRoulezEco');
const stationOil = require(paths.path_app_controllers+'station_oil_history');
const encrypt_nohash = require(paths.path_app_models+'encrypt-nohash');

module.exports = {

	init: async function() {
        cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_CONTEXT,
            maxConcurrency: 2,
            monitor: true
        })

		console.log('SCHEDULE MANAGER START');
		let automations = await Automation.getAll();
		console.dir(automations);
		await module.exports.handleTask();
		let promises = [];
		if (automations.length > 0) {
			for (let i=0; i<automations.length; i++) {
				promises.push(module.exports.addScheduledJob(automations[i]));
			}		
			Promise.all(promises)
			.then(async function() {
				console.log('ALL TASKS ENQUEUED');
				// console.log('ENQUEUE FINISH');
				// await module.exports.close();	
				// return automations;
			})					
		}
		else {
			return false;
		}
	},

	getScheduledJob: async function(id_station) {
		if (id_station) {
			let task = schedule.scheduledJobs[`id_${id_station}`];
			return task;
		}
		else {
			return null;
		}
	},	

	getAllScheduledJobs: function() {
		let tasks = schedule.scheduledJobs;		
		return tasks;
	},

	addScheduledJob: async function(automation) {
		return new Promise(function(resolve, reject) {		
			let scraping_time = automation['scraping_time'];
			let hour = scraping_time.split(':')[0];
			let minutes = scraping_time.split(':')[1];			
			console.log(`ADDING SCHEDULED JOB FOR AUTOMATION NUM ${automation['id']} at HOUR : ${hour}h${minutes}`);
			let task = schedule.scheduleJob(`id_${automation['id']}`, `${minutes} ${hour} * * *`, async function() {
				console.log('SCHEDULED JOB LAUNCHED FOR AUTOMATION NUM '+automation['id']);
				cluster.queue(automation);
				console.log('enqueued');
				resolve(true);	
			});		
			resolve();	
		})
		// await cluster.idle();
  //       await cluster.close();
	},

	// Fonction qui se déclenche au lancement d'un scheduledJob (à l'heure du 'scraping_time')
	handleTask: async function() {
		console.log('HANDLE TASK FUNCTION');
        console.log('HANDLE TASK LAUNCHING !');
            cluster.task(async ({ page, data }) => {
                console.dir(data);
                console.log('TASK LAUNCHED FOR AUTOMATION NUM '+data['id']);
                try {            	
                	let credentials = {
                		mosaic_username: data['mosaic_username'],
                		mosaic_password: encrypt_nohash.decrypt(JSON.parse(data['mosaic_password'])),
                		roulezeco_username: data['roulezeco_username'],
                		roulezeco_password: encrypt_nohash.decrypt(JSON.parse(data['roulezeco_password'])),                		
                	}
	                let result = await getMosaic.launch(page, credentials);
                   	await Automation.updateLastConnexionTime(true, 'mosaic', data['id']);	                	
                    console.log('MOSAIC SCRAPING RESULTS FOR AUTOMATION NUM '+data["id"]+' = '+result);           
                    let carbusDatas = result[0].stationPrix;
                    let absentCarbus = result[1];
                    let result2 = await getRoulezEco.launch(page, credentials, result[0], absentCarbus);
                    console.log('ROULEZECO SCRAPING RESULTS FOR AUTOMATION NUM '+data["id"]+' = '+result);
                    let stationId = data.id_station;
                    for (let oilTypeObj of carbusDatas) {
                        // console.dir(oilTypeObj);
                        let oilId = oilTypeObj.oil_id;
                        let oilPrice = oilTypeObj.carbuPrice;
                        console.log('PREPARING TO INSERT PRICE TO AUTOMATION NUM '+data['id']);
                        let recordingResult = await stationOil.insertPrice({id_station: stationId, id_oil: oilId, price: oilPrice});
                        if(recordingResult === true) {
                            // await module.exports.close();
                            console.log('CLOSE FOR '+data['id']);
                        }
                        else {
                            // await module.exports.close();
                            console.log('CLOSE FOR '+data['id']);
                        }
                    }
                    await writeLog('success', `SCRAPING SUCCEED FOR AUTOMATION ${data['id']}`);
                }
                catch(err) {
                	console.log('CATCH ERROR');
                	console.dir(err);
                	throw err;
                    // console.log(err);
                    // if (err.website) {
                    //     let website = err.website;
                    //    	await Automation.updateLastConnexionTime(false, website, data['id']);
                    //     let errorMessage = `CREDENTIALS ERROR FOR STATION ${data['id_station']}, AUTOMATION ${data['id']}, WEBSITE = ${website}`;
                    //     await writeLog(true, errorMessage);
                    // }                	
                }
            })            

            // Fonction qui se déclenche en cas d'erreur lors du scraping
            cluster.on('taskerror', async(err, data) => {
            	console.dir(err);
            	console.dir(data);
            	let error_message = `Error of crawling for automation ${data['id']}: ${err.message}`;
                console.log(error_message);

                // if ("second_try" in task_updated) {
					let secondTry_results = await module.exports.treat(err ,data);
					// S'il s'agit d'un problème d'authentification qui s'est confirmé deux fois d'affilé
					if ("credentials_error_confirmation" in secondTry_results) {
						await module.exports.credentialsExpired(secondTry_results);
					}
					// S'il s'agit d'un problème d'une autre nature, qui s'est confirmé deux fois
					else if ("unknown_error_confirmation" in secondTry_results) {
						await module.exports.scrapingFailed(secondTry_results);
					}
					// S'il s'agit d'une erreur lors d'une première tentative (quelle que soit l'erreur)
					else if ("second_try" in secondTry_results) {
						await module.exports.secondTry(secondTry_results);
					}

				// }
            });

		    // await cluster.idle();
		    // await cluster.close();
		    console.log('END');

	},

	close: async function() {
		await cluster.idle();
		await cluster.close();		
		console.log('CLOOOOOOOOOOOOOOOOSE !!');
	},

	editScheduledJob: async function(automationInfos) {
		return new Promise(function(resolve, reject) {		
			try {			
				let id_automation = automationInfos['id'];
				console.dir(automationInfos);
				console.log(id_automation);
				// console.dir(schedule.scheduledJobs);
				let old_task = schedule.scheduledJobs[`id_${id_automation}`];
				old_task.cancel();
				module.exports.addScheduledJob(automationInfos);
				resolve();
			}
			catch(err) {
				console.log(err);
				reject(err);
			}
		})
	},

	deleteScheduledJob: async function(id_automation) {
		return new Promise(function(resolve, reject) {		
			try {		
				console.log(id_automation);
				let old_task = schedule.scheduledJobs[`id_${id_automation}`];
				old_task.cancel();		
				resolve();
			}
			catch(err) {
				console.log(err);
				reject(err);
			}
		})
	},

	secondTry: async function(automation) {
		console.log('SECOND TRY FOR AUTOMATION NUM '+automation['id']);
		let scraping_time = automation['scraping_time'];
		let updated_date = moment().add(1, 'm').toObject();
		let updated_id = parseInt(automation['id'], 10) + 5000;		
		automation['second_try'] = true;
		automation['id'] = updated_id;
		let updated_scraping_time = `${updated_date['hours']}:${updated_date['minutes']}:${updated_date['seconds']}`;
		console.log('UPDATED SCRAPING TIME FOR AUTOMATION NUM '+automation['id']+' = '+updated_scraping_time);
		automation['scraping_time'] = updated_scraping_time;
		let task = schedule.scheduleJob(`id_${updated_id}`, `${updated_date['minutes']} * * * *`, async function() {
			let scheduledTasks = module.exports.getAllScheduledJobs();
			// await writeLog(0, 'AUTOMATION '+automation['id']+' SCHEDULED !!');
			await cluster.queue(automation);
			// if ("credentials_error_confirmation" in task_updated_secondtime) {
			// 	await module.exports.credentialsExpired(task_updated_secondtime);
			// }			
			// await module.exports.deleteScheduledJob(updated_id);
			// scheduledTasks = module.exports.getAllScheduledJobs();
			// return true;	
		});				
	},

	credentialsExpired: async function(automation) {
		let errMessage = `Credentials expired / wrong for automation ${automation['id_station']} on website ${automation['credentials_error_website']}`;
		console.log(errMessage);
		await module.exports.deleteScheduledJob(automation['id']);
		scheduledTasks = await module.exports.getAllScheduledJobs();
		await writeLog('error', errMessage);
		await sendMail('admin', 'error', errMessage);
	},

	scrapingFailed: async function(automation) {
		console.dir(automation);
		console.dir(automation['credentials_error_website']);
		let errMessage = `Scraping failed for automation ${automation['id_station']} on website ${automation['credentials_error_website']}
		: ${automation.error_message}`;
		console.log(errMessage);
		await writeLog('error', errMessage);
		await sendMail('admin', 'error', errMessage);
	},	

	// Fonction qui contrôle la cause de l'échec du scraping, et fait remonter l'info
    treat: async function(err, task) {
        console.log('SECOND TRY FUNCTION');
        console.dir(err);
        console.dir(task);
        return new Promise(async function(resolve, reject) {   
        	// on déinit ici s'il s'agit d'un problème d'authentification
            if (err.message.indexOf('CREDENTIALS') > -1) {
                task["credentials_error"] = true;
                task["credentials_error_website"] = err.website;
                console.log('CONDITON 1');
            }
            // on définit ici si c'est la première ou seconde tentative
            if ("second_try" in task) {
            	// Ici, on identifie qu'il s'agit certainement d'une erreur d'authentification
                if ("credentials_error" in task) {
                    task["credentials_error_confirmation"] = true;
                }
                // Ici, l'erreur n'est pas identifiée à priori
                else {
                	task["unknown_error_confirmation"] = true;
                	task["error_message"] = err;
                	task["unknown_error_website"] = err.website;
                }
                console.log('CONDITON 2');
            }
            else {
                task["second_try"] = true;
                console.log('secondTry');
                console.log('CONDITON 3');
            }        
            resolve(task);
        })
    }	

}