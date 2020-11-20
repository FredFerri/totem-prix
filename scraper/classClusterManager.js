const paths = require('../paths');
const dbManager = require(paths.path_db+'dbManager');
const { Cluster } = require('puppeteer-cluster');
const fs = require('fs');
const scheduleManager = require('./scheduleManager');
console.dir(scheduleManager);
const getMosaic = require('./getMosaic');
const getRoulezEco = require('./getRoulezEco');
const pricesManager = require(paths.path_controllers+'station_oil_history');
const writeLog = require('./writeLog');

module.exports = class ClusterManager {

    constructor(monitor, maxConcurrency) {
        this.monitor = monitor;
        this.maxConcurrency = maxConcurrency;
        this.failedCitys = [];
        this.init();
    }

    async init() {
        this.cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_CONTEXT,
            maxConcurrency: this.maxConcurrency,
            monitor: this.monitor,
        });         
    }

    async enqueue(datas) {
        this.cluster.queue(datas);
        return true;

    }   

    async handleTask(data) {
        this.cluster.task(async ({ page, data }) => {
            let result = await getMosaic.launch(page, data);
            let carbusDatas = result[0].stationPrix;
            let absentCarbus = result[1];
            await getRoulezEco.launch(page, result[0], absentCarbus);
            console.dir(result);
            console.dir(result[0].stationPrix);
            let stationId = result[0].stationId;
            for (let oilTypeObj of carbusDatas) {
                // console.dir(oilTypeObj);
                let oilId = oilTypeObj.oil_id;
                let oilPrice = oilTypeObj.carbuPrice;
                let recordingResult = await pricesManager.insertPrice({id_station: stationId, id_oil: oilId, price: oilPrice});
                if(recordingResult === true) {
                    console.log('NEW RECORDING !');
                    return 'OK';           
                }
                else {
                    console.log(recordingResult);
                    return recordingResult;
                }
            }
            await this.cluster.idle();
            await this.cluster.close();            
        })            
        this.cluster.on('taskerror', async(err, data) => {
            console.log(`  Error crawling ${data}: ${err.message}`);
            let task_updated = await this.secondTry(err, data);
            return task_updated;       
        });
    }

    logError(err, data) {
        let date = new Date();
        let structuredMessage = `${date} - ${err} - ERROR ENCOUNTERED BY USER ${data.user_name} - USER ID = ${data.user_id} \r\n`;
        fs.appendFile('./argos_logs.txt', structuredMessage, function (err) {
          if (err) throw err;
          console.log('The "data to append" was appended to file!');
        });         
    }

    async secondTry(err, task) {
        console.log('SECOND TRY FUNCTION');
        console.dir(task);
        return new Promise(async function(resolve, reject) {        
            if (err.message.indexOf('CREDENTIALS') > -1) {
                task["credentials_error"] = true;
                task["credentials_error_website"] = err.website;
                console.log('CONDITON 1');
            }
            if ("second_try" in task) {
                if ("credentials_error" in task) {
                    task["credentials_error_confirmation"] = true;
                }
                console.log('CONDITON 2');
            }
            else {
                task["second_try"] = true;
                console.log('secondTry');
                console.log('CONDITON 3');
            } 
            return task;       
        })        
    }

}