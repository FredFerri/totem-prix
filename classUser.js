const bcrypt = require('bcrypt');

module.exports = class User {

	constructor(datas) {
		if (datas) {		
			this.firstName = datas['first_name'];
			this.lastName = datas['last_name'];
			this.street = datas['street'];
			this.cp = datas['cp'];
			this.city = datas['city'];
			this.siret = datas['siret'];
			this.email = datas['email'];
			this.tel = datas['tel'];
		}
	}

	setMainInfos(datas) {
		this.firstname = datas.firstname;
		this.lastname = datas.lastname;
		this.email = datas.email;
		let password = bcrypt.hash(datas.password, 10);
		this.password = datas.password;
	}

	async getUserById(userId) {
        let query = `SELECT first_name, last_name, street, cp, city, siret, email, tel
        	FROM User WHERE id=${userId};`;
        let datas = await db.query(query);
        this.constructor(datas.rows[0]);
	}


}