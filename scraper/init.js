const paths = require('../paths');
const dbManager = require(paths.path_db+'dbInit');
const scheduleManager = require('./scheduleManager');
const schedule = require('node-schedule');
const clusterManager = require('./clusterManager');

async function startApp() {
	// await dbManager.init();
	await clusterManager.init();
	await scheduleManager.init();
	let scheduledJobs = await scheduleManager.getAllScheduledJobs();
};

async function stopApp() {
	console.log('PROGRAM SHUTTING DOWN...');
	process.exit();
}


startApp();

// setInterval(async function() {
// 	await stopApp();
// }, 30000)