// const paths = require('../../paths');
// const scheduleManager = require(paths.path_scraper+'scheduleManager');
// const clusterManager = require(paths.path_scraper+'clusterManager');
// const mosaic = require(paths.path_scraper+'getMosaic');
// const roulezeco = require(paths.path_scraper+'getRoulezEco');
// const writeLog = require(paths.path_scraper+'/writeLog');


// module.exports = {
// 	testCredentials: async function(datas) {
// 		return new Promise(async function(resolve, reject) {
// 			try {			
// 				console.log('CONTROLLER SCRAPER');
// 				console.dir(datas);
// 				let mosaicTest = await mosaic.testCredentials(datas);
// 				console.dir(mosaicTest);
// 				if (mosaicTest.error === true) {
// 					let errorMessage = `TEST CREDENTIALS ERROR : ${mosaicTest.message} 
// 					FOR AUTOMATION ${datas['automation_id']}, WEBSITE = MOSAIC`; 
// 					await writeLog('error', errorMessage);
// 				}
// 				let roulezecoTest = await roulezeco.testCredentials(datas);
// 				console.dir(roulezecoTest);
// 				if (roulezecoTest.error === true) {
// 					let errorMessage = `TEST CREDENTIALS ERROR : ${mosaicTest.message} 
// 					FOR AUTOMATION ${datas['automation_id']}, WEBSITE = ROULEZECO`; 
// 					await writeLog('error', errorMessage);
// 				}
// 				resolve({mosaicTest: mosaicTest, roulezecoTest: roulezecoTest});
// 			}
// 			catch(err) {
// 				console.log(err);
// 				reject(err);
// 			}

// 		})
// 	},

// 	addAutomation: async function(automation) {
// 		return new Promise(async function(resolve, reject) {
// 			console.dir(automation);
// 			await scheduleManager.addScheduledJob(automation);
// 			resolve();
// 		})
// 	},

// 	editAutomation: async function(automation) {
// 		return new Promise(async function(resolve, reject) {
// 			console.dir(automation);
// 			await scheduleManager.editScheduledJob(automation);
// 		})
// 	},	

// 	setDisrupts: async function(datas) {
// 		return new Promise(async function(resolve, reject) {
// 			try {
// 				await roulezeco.setOilBreak(datas);
// 				let successMessage = `DISRUPT SET SUCCEED FOR AUTOMATION ${datas['automation_id']}`;
// 				await writeLog('success', errorMessage);
// 				resolve({'error': false});
// 			}
// 			catch(err) {
// 				console.log('ERREUR 2');
// 				console.log(err);
// 				let errorMessage = `DISRUPT SET FAILED FOR AUTOMATION ${datas['automation_id']} WITH ERRROR ${err}`;
// 				await writeLog('error', errorMessage);
// 				resolve({'error': true});
// 			}
// 		})
// 	},

// 	detectOils: async function(roulezeco_username, roulezeco_password, automation_id) {
// 		return new Promise(async function(resolve, reject) {
// 			try {
// 				let oils = await roulezeco.detectOils(roulezeco_username, roulezeco_password);
// 				let successMessage = `DETECT OILS SUCCEED FOR AUTOMATION ${automation_id}`;
// 				await writeLog('success', successMessage);
// 				resolve(oils);
// 			}	
// 			catch(err) {
// 				let errorMessage = `DETECT OILS FAILED FOR AUTOMATION ${automation_id}`;
// 				await writeLog('error', errorMessage);
// 				reject({'error': true});
// 			}
// 		})
// 	},

// 	start: async function() {
// 		return new Promise(async function(resolve, reject) {
// 			try {			
// 				await clusterManager.init();
// 				await scheduleManager.init();
// 				resolve();
// 			}
// 			catch(err) {
// 				console.log(err);
// 				reject(err);
// 			}
// 		})
// 	},	

// 	restart: async function() {
// 		return new Promise(async function(resolve, reject) {
// 			try {			
// 				await clusterManager.close();
// 				await scheduleManager.close();
// 				await clusterManager.init();
// 				await scheduleManager.init();
// 				resolve();
// 			}
// 			catch(err) {
// 				console.log(err);
// 				reject(err);
// 			}
// 		})
// 	}
// }