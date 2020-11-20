const paths = require('../../paths');
let db = require(paths.path_db+'dbInit');
const moment = require('moment-timezone');

exports.create = async function(datas) {
  return new Promise(async function(resolve, reject) {
    try {
      console.dir(datas);
      let date_now = moment().tz('Europe/Paris').locale('fr').format();
      let query = {
        name: 'add-automation',
        text: `INSERT INTO automation(mosaic_username, mosaic_password, roulezeco_username, 
              roulezeco_password, scraping_time, id_station, mosaic_last_connexion, roulezeco_last_connexion)  
              VALUES($1, $2, $3, $4, $5, $6, $7, $8) 
              RETURNING *`,
        values: [datas["mosaic_username"], datas["crypted_mosaic_password"], datas["roulezeco_username"],
                datas["crypted_roulezeco_password"], datas["scraping_time"], datas["id_station"],
                'Jamais', 'Jamais']
      };      
      console.log(query);
      let automation = await db.query(query);
      resolve(automation.rows[0]);      
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
      let date_now = moment().tz('Europe/Paris').locale('fr').format();
      let scraping_time = datas["scraping_time"].substring(0, datas["scraping_time"].lastIndexOf(':'));
      let query = {
        name: 'update-automation',
        text: `UPDATE automation SET mosaic_username = $1, 
              mosaic_password = $2, 
              roulezeco_username = $3, 
              roulezeco_password = $4, 
              scraping_time = $5 
              WHERE id = $6
              RETURNING *`,
        values: [datas["mosaic_username"], datas["crypted_mosaic_password"], datas["roulezeco_username"], 
                datas["crypted_roulezeco_password"], scraping_time, datas["id_automation"]]
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

exports.updateLastConnexionTime = async function(success, website, id_automation) {
  return new Promise(async function(resolve, reject) {
    let date_now = moment().tz('Europe/Paris').locale('fr').format('Do MMMM YYYY, h:mm');    
    let query;
    if (success === false) {
      query = {
        name: 'update-mosaic-connexion-time-fail',
        text: `UPDATE automation SET ${website}_last_connexion = $1 
              WHERE id = $2`,
        values: [date_now,  id_automation]
      };      
    }
    else {
      query = {
        name: 'update-mosaic-connexion-time-success',
        text: `UPDATE automation SET ${website}_last_connexion = $1 
              WHERE id = $2`,
        values: [date_now, id_automation]
      };        
    }
    try {
      console.log(query);
      let result = await db.query(query);
      resolve(result);
    }
    catch(err) {
      reject(err);
    }
  })
},

exports.updateMosaicState = async function(id_automation, state) {
  return new Promise(async function(resolve, reject) {
    let query;
    let date_now = moment().tz('Europe/Paris').locale('fr').format('Do MMMM YYYY, h:mm');      
    if (state == 'Actif') {
      query = {
        name: 'update-mosaic-state',
        text: `UPDATE automation SET mosaic_state = $1, mosaic_last_connexion = $2
              WHERE id = $3`,
        values: [state, date_now, id_automation]
      };
    }
    else {
      query = {
        name: 'update-mosaic-state2',
        text: `UPDATE automation SET mosaic_state = $1 
              WHERE id = $2`,
        values: [state, id_automation]
      };
    }      
    console.log(query);
    try {
      let result = await db.query(query);
      resolve();
    }
    catch(err) {
      reject(err);
    }
  })
}

exports.updateRoulezecoState = async function(id_automation, state) {
  return new Promise(async function(resolve, reject) {
    let query;
    let date_now = moment().tz('Europe/Paris').locale('fr').format('Do MMMM YYYY, h:mm');
    if (state == 'Actif') {
      query = {
        name: 'update-roulezeco-state',
        text: `UPDATE automation SET roulezeco_state = $1, roulezeco_last_connexion = $2  
              WHERE id = $3`,
        values: [state, date_now, id_automation]
      };    
    } 
    else {    
      query = {
        name: 'update-roulezeco-state2',
        text: `UPDATE automation SET roulezeco_state = $1 
              WHERE id = $2`,
        values: [state, id_automation]
      };   
    }   
    console.log(query);     
    try {
      let result = await db.query(query);

      resolve();
    }
    catch(err) {
      reject(err);
    }
  })
}




exports.getById = function(id) {
  return new Promise(async function(resolve, reject) {  
    let query = {
      name: 'get-automation-by-id',
      text: `SELECT id, mosaic_username, mosaic_password, roulezeco_username, roulezeco_password, scraping_time, 
            roulezeco_last_connexion, mosaic_last_connexion, id_station 
            FROM automation WHERE id = $1`,
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
},

exports.getCredentialsById = function(id) {
  return new Promise(async function(resolve, reject) {  
    let query = {
      name: 'get-automation-by-id',
      text: `SELECT mosaic_username, mosaic_password, roulezeco_username, roulezeco_password 
      FROM automation WHERE id = $1`,
      values: [id]
    };        
    console.log(query)
    try {
      let user = await db.query(query);
      resolve(user.rows[0]);
    }
    catch(err) {
      reject(err);
    }
  })
},

exports.getAll = function(id) {
  return new Promise(async function(resolve, reject) {  
    let query = {
      name: 'get-all-automations',
      text: `SELECT id, mosaic_username, mosaic_password, roulezeco_username, roulezeco_password, scraping_time, 
            roulezeco_last_connexion, mosaic_last_connexion, id_station 
            FROM automation`,
      values: []
    };           
    try {
      let user = await db.query(query);
      resolve(user.rows);
    }
    catch(err) {
      reject(err);
    }
  })  
},

exports.getAllScheduleInfos = function(id) {
  return new Promise(async function(resolve, reject) {  
    let query = {
      name: 'get-all-automations',
      text: `SELECT id, scraping_time
            FROM automation`,
      values: []
    };           
    try {
      let user = await db.query(query);
      resolve(user.rows);
    }
    catch(err) {
      reject(err);
    }
  })  
},

exports.getByStationId = function(id_station) {
  return new Promise(async function(resolve, reject) {  
    let query = {
      name: 'get-automation-by-station-id',
      text: `SELECT id, mosaic_username, mosaic_password, roulezeco_username, roulezeco_password, scraping_time, 
            roulezeco_last_connexion, mosaic_last_connexion, mosaic_state, roulezeco_state, id_station 
            FROM automation WHERE id_station = $1`,
      values: [id_station]
    };          
    try {
      let user = await db.query(query);
      resolve(user.rows[0]);
    }
    catch(err) {
      reject(err);
    }
  })
},

exports.delete = function(id) {
  console.log(id);
  return new Promise(async function(resolve, reject) {
    let query = {
      name: 'delete-automation',
      text: `DELETE FROM automation WHERE id = $1`,
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