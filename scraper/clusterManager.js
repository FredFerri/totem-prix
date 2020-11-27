const paths = require('../paths');
const { Cluster } = require('puppeteer-cluster');
const getMosaic = require('./getMosaic');
const getRoulezEco = require('./getRoulezEco');
const pricesManager = require(paths.path_app_models+'station_oil_history');
const writeLog = require('./writeLog');
const maxConcurrency = 5;
const monitor = true;
let cluster = '';
var failedStations = [];

module.exports = {
    init: async function() {
        return new Promise(async function(resolve, reject) {        
            cluster = await Cluster.launch({
                concurrency: Cluster.CONCURRENCY_CONTEXT,
                maxConcurrency: maxConcurrency,
                monitor: monitor
            })
            resolve();
        })
    },

	enqueue: async function(task) {
        return new Promise(async function(resolve, reject) {        
            cluster.queue(task);
            resolve();
        })
	},

    handleTask: async function() {
        console.log('HANDLE TASK LAUNCHING !');
            cluster.task(async ({ page, data }) => {
                console.dir(data);
                console.log('TASK LAUNCHED FOR AUTOMATION NUM '+data['id']);
                try {
                    let result = await getMosaic.launch(page, data);
                    if (result) {              
                        console.log('MOSAIC SCRAPING RESULTS FOR AUTOMATION NUM '+data["id"]+' = '+result);           
                        let carbusDatas = result[0].stationPrix;
                        let absentCarbus = result[1];
                        let credentials = {username: data['roulezeco_username'], password: data['roulezeco_password']};
                        let result2 = await getRoulezEco.launch(page, credentials, result[0], absentCarbus);
                        if (result2 === true) {                    
                            console.log('ROULEZECO SCRAPING RESULTS FOR AUTOMATION NUM '+data["id"]+' = '+result2);
                            let stationId = result[0].stationId;
                            for (let oilTypeObj of carbusDatas) {
                                // console.dir(oilTypeObj);
                                let oilId = oilTypeObj.oil_id;
                                let oilPrice = oilTypeObj.carbuPrice;
                                console.log('PREPARING TO INSERT PRICE TO AUTOMATION NUM '+data['id']);
                                let recordingResult = await pricesManager.insertPrice({id_station: stationId, id_oil: oilId, price: oilPrice});
                                if(recordingResult === true) {
                                    // await module.exports.close();
                                    console.log('CLOSE FOR '+data['id']);
                                }
                                else {
                                    // await module.exports.close();
                                    console.log('CLOSE FOR '+data['id']);
                                }
                            }
                        }
                    }
                }
                catch(err) {
                    console.log(err);
                    if (err.website) {
                        let problem = 'credentials';
                        let website = err.website;
                    }
                }
            })


            // In case of problems, log them
            cluster.on('taskerror', async(err, data) => {
                console.log(`  Error crawling ${data['id']}: ${err.message}`);
                // writeLog(1, err, data);
                // if (failedStations.indexOf(data) == -1) {
                //     failedStations.push(data);
                // }         
                let task_updated = await module.exports.secondTry(err, data);
                // await module.exports.close();
                return task_updated;
            });

            // await cluster.idle();
            // await cluster.close();               
     },

    close: async function() {
        return new Promise(async function(resolve, reject) {        
            await cluster.idle();
            await cluster.close();   
            resolve();      
        })
    },

    secondTry: async function(err, task) {
        console.log('SECOND TRY FUNCTION');
        console.dir(task);
        return new Promise(async function(resolve, reject) {        
            if (err.message.indexOf('CREDENTIALS') > -1) {
                task["credentials_error"] = true;
                task["credentials_error_website"] = err.website;
                console.log('CONDITON 1');
            }
            if ("second_try" in task) {
                if ("credentials_error" in task) {
                    task["credentials_error_confirmation"] = true;
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