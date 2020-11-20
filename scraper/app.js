const express = require('express');
var app = express();
var server = require('http').createServer(app);
const paths = require('../paths');
const bodyParser = require('body-parser');
const moment = require('moment');
const jwtManager = require(paths.path_app_controllers+'jwt');
const dbManager = require(paths.path_db+'dbManager');
const { check, oneOf, validationResult } = require('express-validator');
const validator = require('validator');
const scheduleManager = require(paths.path_scraper+'scheduleManager');
const clusterManager = require('./clusterManager');
const mosaic = require(paths.path_scraper+'getMosaic');
const roulezeco = require(paths.path_scraper+'getRoulezEco');
const writeLog = require(paths.path_scraper+'/writeLog');

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
		console.log('CONTROLLER SCRAPER');
		console.dir(credentials);
		let mosaicTest = await mosaic.testCredentials(credentials);
		console.dir(mosaicTest);
		if (mosaicTest.error === true) {
			let errorMessage = `TEST CREDENTIALS ERROR : ${mosaicTest.message} 
			FOR STATION ${credentials['id_station']}, 
			FOR AUTOMATION ${credentials['id']}, 
			WEBSITE = MOSAIC`; 
			await writeLog('error', errorMessage);
		}
		let roulezecoTest = await roulezeco.testCredentials(credentials);
		console.dir(roulezecoTest);
		if (roulezecoTest.error === true) {
			let errorMessage = `TEST CREDENTIALS ERROR : ${mosaicTest.message} 
			FOR STATION ${credentials['station_id']}, 
			FOR AUTOMATION ${credentials['id']}, 
			WEBSITE = ROULEZECO`; 
			await writeLog('error', errorMessage);
		}
		res.status(200).send({mosaicTest: mosaicTest, roulezecoTest: roulezecoTest});
	}
	catch(err) {
		console.log(err);
		res.status(500).send(err);
	}
})

app.post('/set-disrupts/', async function(req, res) {
	try {
		let infosScraping = req.body.infosScraping;
		await roulezeco.setOilBreak(infosScraping);
		res.status(200).send(true);
	}
	catch(err) {
		res.status(500).send(err);
	}	
})

app.post('/detect-oils/', async function(req, res) {
	try {
		let roulezeco_username = req.body.roulezeco_username;
		let roulezeco_password = req.body.roulezeco_password;
		let oilsList = await roulezeco.detectOils(roulezeco_username, roulezeco_password);
		res.status(200).send(oilsList);
	}
	catch(err) {
		console.log(err);
		res.status(500).send(err);
	}	
})

app.post('/add-automation/', async function(req, res) {
	try {
		console.log('OUI OUI');
		let automationInfos = req.body.automationInfos;
		console.dir(automationInfos);
		scheduleManager.addScheduledJob(automationInfos);
		let scheduledJobs = await scheduleManager.getAllScheduledJobs();
		console.dir(scheduledJobs);		
		console.log('OKKKKKKKKKKK');
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
		console.dir(scheduledJobs);		
		res.status(200).send(true);	
	}
	catch(err) {
		console.log(err);
		res.status(500).send(err);
	}	
})

app.delete('/delete-automation/:automationId', async function(req, res) {
	try {	
		console.log('REQUEST');
		console.dir(req);
		let automationId = req.params.automationId;
		await scheduleManager.deleteScheduledJob(automationId);
		let scheduledJobs = await scheduleManager.getAllScheduledJobs();
		console.dir(scheduledJobs);
		console.log(`AUTOMATION ${automationId} DELETED`);		
		res.status(200).send(true);	
	}
	catch(err) {
		console.log(err);
		res.status(500).send(err);		
	}
})


server.listen(8181, async function() {
	await clusterManager.init();
	await scheduleManager.init();	
	let scheduledJobs = await scheduleManager.getAllScheduledJobs();
	console.dir(scheduledJobs);	
    console.log('ARGOS SCRAPER APP RUNNING...');
});