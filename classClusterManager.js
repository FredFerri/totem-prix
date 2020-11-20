const { Cluster } = require('puppeteer-cluster');
const fs = require('fs');
const getMosaic = require('./getMosaic');
const getRoulezEco = require('./getRoulezEco');
const pricesManager = require('./station_oil_history');
const dbManager = require('./dbManager');
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
                    if (this.failedCitys.indexOf(data) > -1) {
                        console.log('SPLICE !');
                        let indexToDrop = this.failedCitys.indexOf(data);
                        this.failedCitys.splice(indexToDrop, 1);
                    }                
                }
                else {
                    console.log(recordingResult);
                }
            }
        })        

        // In case of problems, log them
        this.cluster.on('taskerror', (err, data) => {
            console.log(`  Error crawling ${data}: ${err.message}`);
            await writeLog(1, err, data);
            if (this.failedCitys.indexOf(data) == -1) {
                this.failedCitys.push(data);
            }            
        });

        await this.cluster.idle();
        await this.cluster.close();
    }   

    logError(err, data) {
        let date = new Date();
        let structuredMessage = `${date} - ${err} - ERROR ENCOUNTERED BY USER ${data.user_name} - USER ID = ${data.user_id} \r\n`;
        fs.appendFile('./argos_logs.txt', structuredMessage, function (err) {
          if (err) throw err;
          console.log('The "data to append" was appended to file!');
        });         
    }

}