const paths = require('../../paths');
let db = require(paths.path_db+'dbInit');
const moment = require('moment');


module.exports = {
	insertPrice: async function(datas) {
		return new Promise(async function(resolve, reject) {
			try {
				console.dir(datas);
				let date_now = moment().format();
		        let query = `INSERT INTO station_oil_history(id_station, id_oil, price, date) 
		        	VALUES('${datas["id_station"]}', '${datas["id_oil"]}', '${datas["price"]}', '${date_now}');`;
		        console.log(query);
		        await db.query(query);
		        resolve(true);			
			}
			catch(err) {
				reject(err);
			}
		})
	},

	getPrices: async function(datas) {
		let query = `SELECT price, date 
			FROM station_oil_history
			WHERE id_station=${id_station} AND id_oil=${id_oil} 
			AND date >= ${date_start}
			AND date <= ${date_end}`;
		let prices = await db.query(query);
		return prices.rows;		
	}
}