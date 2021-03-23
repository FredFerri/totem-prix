const express = require('express');
var app = express();
var server = require('http').createServer(app);
const paths = require('../paths');
const bodyParser = require('body-parser');
const jwtManager = require(paths.path_app_controllers+'jwt');
const { check, oneOf, validationResult } = require('express-validator');
const scheduleManager = require(paths.path_scraper+'scheduleManager');
const clusterManager = require('./clusterManager');
const mosaic = require(paths.path_scraper+'getMosaic');
const roulezeco = require(paths.path_scraper+'getRoulezEco');
const writeLog = require(paths.path_scraper+'/writeLog');
const writeLogSheets = require(paths.path_app_controllers+'/writeLogsInSheets');
const URL_ARGOS_SCRAPER_PORT = process.env.URL_ARGOS_SCRAPER_PORT;

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());


app.get('/restart', async function(req, res) {
	try {	
		await clusterManager.close();
		await scheduleManager.close();
		await clusterManager.init();
		await scheduleManager.init();	
		console.log('RESTART');
		res.status(200).send('ok');
	}
	catch(err) {
		res.status(500).send(err);
	}
})

app.post('/test-credentials/', async function(req, res) {
	try {
		let credentials = req.body.credentials;
		let mosaicTest = await mosaic.testCredentials(credentials);
		if (mosaicTest.error === true) {
			let errorMessage = `TEST CREDENTIALS ERROR : ${mosaicTest.message} 
			FOR AUTOMATION ${credentials['automation_id']}, WEBSITE = MOSAIC`; 
			await writeLog('error', errorMessage);
			await writeLogSheets.launch(errorMessage, 'scraper');
		}
		let roulezecoTest = await roulezeco.testCredentials(credentials);
		if (roulezecoTest.error === true) {
			let errorMessage = `TEST CREDENTIALS ERROR : ${roulezecoTest.message} 
			FOR AUTOMATION ${credentials['automation_id']}, WEBSITE = ROULEZ ECO`; 
			await writeLog('error', errorMessage);
			await writeLogSheets.launch(errorMessage, 'scraper');
		}
		if (roulezecoTest.error !== true && mosaicTest.error !== true) {		
			let successMessage = `CREDENTIALS TEST SUCCEED FOR AUTOMATION ${credentials['automation_id']}`; 
			await writeLog('success', successMessage);
			await writeLogSheets.launch(successMessage, 'scraper');		
		}
		res.status(200).send({mosaicTest: mosaicTest, roulezecoTest: roulezecoTest});
	}
	catch(err) {
		console.log(err);
		res.status(500).send(err);
	}
})

app.post('/set-disrupts/', async function(req, res) {
	let infosScraping = req.body.infosScraping;
	try {
		let disrupt = await roulezeco.setOilBreak(infosScraping);
		let successMessage = `SET DISRUPT SUCCEED 
		FOR AUTOMATION ${infosScraping['automation_id']}, WEBSITE = ROULEZ ECO`; 
		await writeLog('success', successMessage);	
		await writeLogSheets.launch(successMessage, 'scraper');		
		res.status(200).send(true);
	}
	catch(err) {
		let errorMessage = `SET DISRUPT ERROR : ${err.message} 
		FOR AUTOMATION ${infosScraping['automation_id']}, WEBSITE = ROULEZ ECO`; 
		await writeLog('error', errorMessage);
		await writeLogSheets.launch(errorMessage, 'scraper');	
		res.status(500).send(err);
	}	
})

app.post('/detect-oils/', async function(req, res) {
	let roulezeco_username = req.body.roulezeco_username;
	let roulezeco_password = req.body.roulezeco_password;
	let automation_id = req.body.automation_id;
	try {
		let oilsList = await roulezeco.detectOils(roulezeco_username, roulezeco_password);		
		res.status(200).send(oilsList);
	}
	catch(errorReturn) {
		let errorMessage = `SET DISRUPT ERROR : ${errorReturn.message} 
		FOR AUTOMATION ${automation_id}, WEBSITE = ROULEZ ECO`; 
		await writeLog('error', errorMessage);
		await writeLogSheets.launch(errorMessage, 'scraper');
		res.status(500).send(errorReturn.message);
	}		
})

app.post('/add-automation/', async function(req, res) {
	try {
		let automationInfos = req.body.automation;
		scheduleManager.addScheduledJob(automationInfos);
		let scheduledJobs = await scheduleManager.getAllScheduledJobs();
		console.dir(scheduledJobs);
		res.status(200).send(true);	
	}
	catch(err) {
		console.log(err);
		res.status(500).send(err);
	}
})

app.put('/edit-automation/', async function(req, res) {
	try {	
		let automationInfos = req.body.automationInfos;
		await scheduleManager.editScheduledJob(automationInfos);
		let scheduledJobs = await scheduleManager.getAllScheduledJobs();
		res.status(200).send(true);	
	}
	catch(err) {
		console.log(err);
		res.status(500).send(err);
	}	
})

app.delete('/delete-automation/:automationId', async function(req, res) {
	try {	
		let automationId = req.params.automationId;
		await scheduleManager.deleteScheduledJob(automationId);
		let scheduledJobs = await scheduleManager.getAllScheduledJobs();	
		res.status(200).send(true);	
	}
	catch(err) {
		console.log(err);
		res.status(500).send(err);		
	}
})


server.listen(URL_ARGOS_SCRAPER_PORT, async function() {
	await clusterManager.init();
	await scheduleManager.init();	
	let scheduledJobs = await scheduleManager.getAllScheduledJobs();
	console.dir(scheduledJobs);	
    console.log('ARGOS SCRAPER APP RUNNING...');
});
