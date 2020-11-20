const db = require('./dbConnect');
// const dbOperation = require('./dbFunctions');
// const taskScheduler = require('./taskScheduler');

module.exports = class Station {

	constructor(datas) {
		if (datas) {		
			this.name = datas['name'];
			this.street = datas['street'];
			this.cp = datas['cp'];
			this.city = datas['city'];
			this.company = datas['company'];
			this.id_user = datas['id_user'];
		}
	},

	addStation(datas) {
        let query = `INSERT INTO station(name, street, cp, city, company, id_user) 
        	VALUES('${datas["name"]}', '${datas["street"]}', '${datas["cp"]}', 
        	'${datas["city"]}', '${datas["company"]}', '${datas["id_user"]}');`;
        await db.query(query);
        return true;		
	},

	getStationByAutomationId(id_user) {
		let query = `SELECT name, street, cp, city, company, id_user
			FROM station WHERE id=${id_user}`;
		let datas = await db.query(query);
		this.constructor(datas);
	}


}