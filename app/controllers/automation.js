const paths = require('../../paths');
const dbManager = require(paths.path_db+'dbManager');

module.exports = {
	getById: async function(id) {
		let query = `SELECT * FROM automation 
			WHERE ID=${automationId}`;
		let result = dbManager.query(query);
		let rows = result.rows[0];
		return rows;		
	},

	getAll: async function() {
		return new Promise(async function(resolve, reject) {	
			try {			
				let query = `SELECT * FROM automation`;
				let result = await dbManager.query(query);
				console.dir(result);
				console.log(result.length);
				let rows = result.rows;
				resolve(rows);	
			}
			catch(err) {
				reject(err);
			}	

		})
	}

}