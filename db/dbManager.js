const { Pool } = require('pg')
const conf = require('./conf');

module.exports = class dbManager {
	constructor() {
		this.pool = new Pool({
			user: conf.user,
		    host: conf.host,
		    database: conf.name,
		    password: conf.pwd,
		    port: conf.port,
		    max: 10			
		});
		this.client;
	}

	async init() {
		this.pool.on('error', (err, client) => {
		  console.error('Unexpected error on idle client', err)
		  process.exit(-1)
		})

		this.client = await this.pool.connect();
		console.log('DB started');
		return this.client;		
	}

	async query(query) {
		try {
			const res = await this.client.query(query)
			console.dir(res);
			// console.log(res.rows[0])
			return res
			this.client.release()
		}
		catch(err) {
			console.log(err.stack)
			return err;
		}				
	}
}



