const dbClass = require('./dbManager');
const db = new dbClass;
db.init();

module.exports = db;