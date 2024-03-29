const paths = require('../paths');
const scheduleManager = require('./scheduleManager');
const clusterManager = require('./clusterManager');

async function startApp() {
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