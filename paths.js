const dotenv = require('dotenv');
let result = dotenv.config({path: '/var/www/argos/.env'});


if (result.error) {
  throw result.error
}

console.log(result.parsed)

module.exports = {
    path_root: process.env.ROOT_PATH,
    path_db: process.env.DB_PATH,
    path_app: process.env.APP_PATH,
    path_app_controllers: process.env.APP_CONTROLLERS_PATH,
    path_app_models: process.env.APP_MODELS_PATH,
    path_app_views: process.env.APP_VIEWS_PATH,
    path_scraper: process.env.SCRAPER_PATH
};
