const fs = require('fs');
const paths = require('../../paths');

module.exports = async function(logType, message) {
	let logFile;
	if (logType == 'error') {
		logFile = "errorAppLogs.txt";
	}
	else {
		logFile = "argosAppLogs.txt";
	}

	let date = new Date();
	let structuredMessage = `${date} - ${message} \r\n`;
	fs.appendFile(paths.path_app+'logs/'+logFile, structuredMessage, function (err) {
	  if (err) throw err;
	  console.log('Written');
	})
}
