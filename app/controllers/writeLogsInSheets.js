const { GoogleSpreadsheet } = require('google-spreadsheet');
const moment = require('moment');

const sheetAccountId = '1n9qW4dGR6oikQPBqdCrzjwKRZK6QUqi8C6gEPVPyEUg';

module.exports = {
	init: async function(sheetAccountId) {
		return new Promise(async function(resolve, reject) {		
			try {			
				const doc = new GoogleSpreadsheet(sheetAccountId);
				const current_month = moment().format('MMMM');
				await doc.useServiceAccountAuth(require('./gsheet_service_acount.json'));
				await doc.loadInfo();
				let sheetsObject = doc.sheetsByIndex;
				let sheetsObjectCount = sheetsObject.length - 1;
				let lastSheet = sheetsObject[sheetsObjectCount];
				let lastSheetTitle = sheetsObject[sheetsObjectCount]._rawProperties.title;
				if (lastSheetTitle != current_month) {			
					const newSheet = await doc.addSheet({ 
						title: current_month,
						headerValues: ['time', 'log', 'app'] 
					});
					console.log('NEW SHEET !');
					resolve(newSheet);		
				}
				else {
					console.log('OLD SHEET !');
					resolve(lastSheet);
				}			
			}
			catch(err) {
				console.log(err);
				reject(err);
			}
		})
	},

	launch: async function(log, app) {
		try {		
			let current_date = moment().format();
			console.log(log);
			console.log(app);
			let sheet = await module.exports.init(sheetAccountId);
			const larryRow = await sheet.addRow({ 
				time: current_date, 
				log: log,
				app: app
			});
			console.log('WRITTEN IN SHEETS !!!!!');
			return true;
		}

		catch(e) {
			console.log(e);
			throw new Error(e.message);
		}
	},


	timeOut: async function(time) {
		return new Promise(function(resolve, reject) {		
			setTimeout(function() {
				console.log('TIMEOUT');
				resolve(true);
			}, time)
		})
	}
}
