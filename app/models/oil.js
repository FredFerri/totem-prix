const paths = require('../../paths');
let db = require(paths.path_db+'dbInit');

exports.getById = function(id) {
  return new Promise(async function(resolve, reject) {  
    let query = {
      name: 'get-oil-by-id',
      text: 'SELECT id, name FROM oil WHERE id = $1',
      values: [id]
    };    
    console.log(query);
    try {
    	let oil = await db.query(query);
    	console.dir(oil);
    	resolve(oil.rows[0]);
    }
    catch(err) {
    	console.log(err);
    	reject(err);
    }
  })
}

exports.getAll = function(id) {
    return new Promise(async function(resolve, reject) {
        let query = {
          name: 'get-all-oil',
          text: 'SELECT id, name FROM oil',
          values: []
        };           
        try {
            let oils = await db.query(query);
            resolve(oils.rows);
        }
        catch(err) {
            resolve(err);
        }
    })
}
