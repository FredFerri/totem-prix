const dotenv = require('dotenv');
dotenv.config({path: '../.env'});

module.exports = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    pwd: process.env.DB_PWD,
    name: process.env.DB_NAME
};