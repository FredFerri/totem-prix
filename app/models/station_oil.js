const paths = require('../../paths');
let db = require(paths.path_db+'dbInit');
const moment = require('moment');


exports.create = function(oilId, oilName, stationId, disrupt) {
    return new Promise(async function(resolve, reject) {
        var query;
        if (disrupt) {
            query = {
                name: 'add-station_oil1',
                text: `INSERT INTO station_oil(id_oil, oil_name, id_station, disrupt) 
                        VALUES($1, $2, $3, $4)`,
                values: [oilId, oilName, stationId, disrupt]
            };      
        }
        else {        
            query = {
                name: 'add-station_oil2',
                text: `INSERT INTO station_oil(id_oil, oil_name, id_station) 
                        VALUES($1, $2, $3)`,
                values: [oilId, oilName, stationId]
            };        
            console.log(query);
        }
        try {
            await db.query(query);
            resolve(true);
        }
        catch(err) {
            console.log(err);
            reject(err);
        }
    })
}

exports.update = function(oilId, oilName, stationId) {
    return new Promise(async function(resolve, reject) {
        let query = {
            name: 'update-station_oil',
            text: `UPDATE station_oil set id_oil = $1, oil_name = $2 WHERE id_station = $3 AND id_oil = $1`,
            values: [oilId, oilName, stationId]
        };
        console.log(query);
        try {
            await db.query(query);
            resolve(true);
        }
        catch(err) {
            reject(err);
        }
    })
}

exports.recordExists = function(stationId, oilId) {
  return new Promise(async function(resolve, reject) { 
    let query = {
      name: 'get-station_oil-record-exists',
      text: `SELECT id_oil FROM station_oil 
            WHERE id_station = $1 AND id_oil = $2`,
      values: [stationId, oilId]
    };   
    console.log(query);
    try {
        let oils = await db.query(query);
        console.dir(oils.rows);
        if (oils.rows.length >= 1) {
            resolve(true);
        } 
        else {
            resolve(false);
        }
    }
    catch(err) {
        console.log(err);
        reject(err);
    }
  })
}

exports.clearAll = function(stationId) {
  return new Promise(async function(resolve, reject) { 
    let query = {
      name: 'station_oil-clear-all',
      text: `DELETE FROM station_oil 
            WHERE id_station = $1`,
      values: [stationId]
    };   
    console.log(query);
    try {
        let result = await db.query(query);
        resolve(true);
    }
    catch(err) {
        console.log(err);
        reject(err);
    }
  })
}


exports.getByStationId = function(stationId) {
  return new Promise(async function(resolve, reject) { 
    let query = {
      name: 'get-station_oil-by-station-id',
      text: `SELECT id_oil, oil_name, disrupt, last_disrupt_date FROM station_oil 
            WHERE id_station = $1`,
      values: [stationId]
    };   
    console.log(query);
    try {
    	let oils = await db.query(query);
    	console.dir(oils.rows);
    	resolve(oils.rows);
    }
    catch(err) {
    	console.log(err);
    	reject(err);
    }
  })
}

exports.setDisrupt = function(datas) {
    return new Promise(async function(resolve, reject) {
        let date_now = moment().format();
        let query;
        if (datas.disruptOil === 'true') {
            query = {
                name: 'set-disrupt',
                text: `UPDATE station_oil SET disrupt = $1, 
                    last_disrupt_date = $2 WHERE id_oil=$3 
                    AND id_station = $4`,
                values: [datas['disruptOil'], date_now, datas['idOil'], datas['idStation']]
            };            
        }
        else {
            query = {
                name: 'unset-disrupt',
                text: `UPDATE station_oil SET disrupt = $1  
                    WHERE id_oil=$2 AND id_station = $3`,
                values: [datas['disruptOil'], datas['idOil'], datas['idStation']]
            };               
        }
        console.log(query);
        try {
            let disruptResult = await db.query(query);
            resolve(true);
        }
        catch(err) {
            console.log(err);
            reject(err);
        }
    })
}

exports.getDisruptTotal = function(idStation) {
    return new Promise(async function(resolve, reject) {
        let query = {
          name: 'get-dirsupt-total',
          text: `SELECT COUNT(*) from station_oil 
                WHERE disrupt = true AND id_station = $1`,
          values: [idStation]
        };         
        try {
            let response = await db.query(query);
            console.dir(response.rows[0]);
            resolve(response.rows[0].count);
        }
        catch(err) {
            console.log(err);
            reject(err);
        }
    })
}