const paths = require('../../paths');
let db = require(paths.path_db+'dbInit');
const moment = require('moment');

exports.create = async function(datas) {
  return new Promise(async function(resolve, reject) {
    try {
      console.dir(datas);
      let date_now = moment().format();
      let query = {
        name: 'add-station',
        text: 'INSERT INTO station (name, street, cp, city, company, id_user) VALUES($1, $2, $3, $4, $5, $6) RETURNING id, name',
        values: [datas["station_name"], datas["station_street"], datas["station_cp"], 
                datas["station_city"], datas["company_name"], datas["id_user"]]
      };
      console.log(query);
      let results = await db.query(query);
      resolve(results.rows[0]);      
    }
    catch(err) {
      reject(err);
    }
  })
},

exports.update = async function(datas) {
  return new Promise(async function(resolve, reject) {
    try {
      console.dir(datas);
      let date_now = moment().format();
      let query = {
        name: 'update-station',
        text: `UPDATE station set name = $1, street = $2, 
                cp = $3, city = $4, company = $5, 
                id_user = $6 WHERE id = $7`,
        values: [datas["station_name"], datas["station_street"], datas["station_cp"], 
                datas["station_city"], datas["company_name"], datas["id_user"], datas["id_station"]]
      };
      console.log(query);
      let updatedUser = await db.query(query);
      resolve(updatedUser.rows[0]);      
    }
    catch(err) {
      reject(err);
    }
  })
},  

exports.getById = function(id) {
  return new Promise(async function(resolve, reject) {  
    let query = {
      name: 'get-station-by-id',
      text: 'SELECT id, name, street, cp, city, company, id_user FROM station WHERE id = $1',
      values: [id]
    };
    try {
      let user = await db.query(query);
      resolve(user.rows[0]);
    }
    catch(err) {
      reject(err);
    }
  })
}

exports.getByUserId = function(userId) {
  return new Promise(async function(resolve, reject) {  
    let query = {
      name: 'get-station-by-userid',
      text: 'SELECT id, name, street, cp, city, company, active, subscription_id, id_user FROM station WHERE id_user = $1',
      values: [userId]
    };    
    console.log(query);
    try {
    	let station = await db.query(query);
    	resolve(station.rows);
    }
    catch(err) {
    	console.log(err);
    	reject(err);
    }
  })
}

exports.activate = function(station_id, subscription_id) {
  return new Promise(async function(resolve, reject) {
    let query = {
      name: 'activate-station',
      text: 'UPDATE station SET active = true, subscription_id = $1 where id = $2',
      values: [subscription_id, station_id]
    };
    try {
      let response = await db.query(query);
      resolve(response);
    }
    catch(err) {
      reject(err);
    }    
  })
}

exports.deactivate = function(id) {
  return new Promise(async function(resolve, reject) {
    let query = {
      name: 'activate-station',
      text: 'UPDATE station SET active = false where id = $1',
      values: [id]
    };
    try {
      let response = await db.query(query);
      resolve(response);
    }
    catch(err) {
      reject(err);
    }    
  })
}

exports.delete = function(id) {
  console.log(id);
  return new Promise(async function(resolve, reject) {
    let query = {
      name: 'delete-station',
      text: 'DELETE FROM station WHERE id = $1',
      values: [id]
    };    
    try {
      console.log(query);
      let response = await db.query(query);
      console.dir(response);
      resolve(response);
    }
    catch(err) {
      reject(err);
    }
  })
}