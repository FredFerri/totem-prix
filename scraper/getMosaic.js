const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const roulezEco = require('./getRoulezEco');
const moment = require('moment');


const blockedResourceTypes = [
  'image',
  'media',
  'font',
  'texttrack',
  'object',
  'beacon',
  'csp_report',
  'imageset',
];

const skippedResources = [
  'quantserve',
  'adzerk',
  'doubleclick',
  'adition',
  'exelator',
  'sharethrough',
  'cdn.api.twitter',
  'google-analytics',
  'googletagmanager',
  'google',
  'fontawesome',
  'facebook',
  'analytics',
  'optimizely',
  'clicktale',
  'mixpanel',
  'zedo',
  'clicksor',
  'tiqcdn',
];

module.exports = {
  launch: async function(page, data, carbus) {
    return new Promise(async function(resolve, reject) {    
      console.dir(data);
      console.log('LISTE CARBUS RECUP EN DB');
      console.dir(carbus);
        // console.log('Started')
        // const browser = await puppeteer.launch({headless:true});
        // console.log('Browser launched')
        // const page = await browser.newPage();
        // console.log('Page launched');

        // await page.setRequestInterception(true);

        // page.on('request', request => {
        //   const requestUrl = request._url.split('?')[0].split('#')[0];
        //   if (
        //     blockedResourceTypes.indexOf(request.resourceType()) !== -1 ||
        //     skippedResources.some(resource => requestUrl.indexOf(resource) !== -1)
        //   ) {
        //     request.abort();
        //   } else {
        //     request.continue();
        //   }
        // });

      try {
        let carbusFormatMosaic = await module.exports.formatMosaicCarbus(carbus);
        console.dir(carbusFormatMosaic);
        await page.setDefaultNavigationTimeout(0);
        await page.goto('https://www.mosaic.total.fr/', { waitUntil: 'load', timeout: 0 });
        await page.waitFor('#login');
        await page.type('#login', data['mosaic_username']);
        await page.type('#pwd', data['mosaic_password']);
        await page.click('input[name="submit"]');
        await page.waitFor(5000);
        let authentication_success = await page.$('.tetemenu');
        if (!authentication_success) {
          reject({message: 'CREDENTIALS ERROR', website: 'mosaic'});
          return false;
        }
        await page.waitFor('.tetemenu', { visible: true })
        await page.goto('https://www.mosaic.total.fr/WDLClient/do/displayRecomPrice', { waitUntil: 'load', timeout: 0 });
        await page.waitFor('table.fondpave', { visible: true })
        const html = await page.evaluate(() => document.querySelector('*').outerHTML);

        const $ = cheerio.load(html);

        let carbusTable = $('.petit_titrepave').parent().children();
        let carbusTab = [];

        // Pour chaque carburant de la liste, on recherche dans le tableau du site mosaic 
        for (let z=0; z<carbusFormatMosaic.length; z++) {
          for (let v=0; v<carbusFormatMosaic[z].carbuMosaicName.length; v++) {          
            let carbuName = carbusFormatMosaic[z].carbuMosaicName[v];
            console.log(carbuName);
            if ($(`.fondpave td:contains('${carbuName}')`).length) {          
              // let carbuPriceOld = $(`.fondpave td:contains('${carbuName}')`).next('td').text();
              // let carbuPrice = $(`.fondpave td:contains('${carbuName}')`).next('td').next('td').text();

              let carbuPriceOld = $(`.fondpave td`).filter(function() {
                return $(this).text() == carbuName;
              }).next('td').text();

              let carbuPrice = $(`.fondpave td`).filter(function() {
                return $(this).text() == carbuName;
              }).next('td').next('td').text();
            
            // for (let i=2; i<carbusTable.length; i++) {
            //   let carbuType = $(carbusTable[i]).find('td:first-child').text();
            //   let carbuPriceOld = $(carbusTable[i]).find('td:nth-child(2)').text();
            //   let carbuPrice = $(carbusTable[i]).find('td:nth-child(3)').text();

              // carbuInfosSupp = await module.exports.carbuNameConvert(carbuType, absentCarbus);
              // if (!carbuInfosSupp) {
              //   continue;
              // }
              // console.dir(carbuInfosSupp);

              let infos = {
                carbuType: carbuName,
                carbuIndexRE: carbusFormatMosaic[z].carbuRoulezEcoId, 
                carbuPriceOld: carbuPriceOld,
                carbuPrice: carbuPrice
              };

              carbusTab.push(infos);    
              // infosKeys.push(carbuName);
            }
            else {
              console.log('No element found in mosaic table for carbu '+carbuName);
            }
          }
        }

        // let stationCode = $('.noir11').find('td:nth-child(3)').text();
        let stationName = $('.noir11').find('td:nth-child(4)').text();
        let stationAdresse = $('.noir11').find('td:nth-child(5)').text();

        stationName = stationName.replace(/[^a-zA-Z0-9 ]/g, "__");
        let societeName = stationName.substr(stationName.lastIndexOf('_')+1);
        stationName = stationName.substr(0, stationName.indexOf('_')); 
        stationAdresse = stationAdresse.replace(/[^a-zA-Z0-9 ]/g, "");    

        let infos = {
          id_user: data['id_user'],
          stationName: stationName,
          stationId: data['id_station'],
          societeName: societeName,
          stationAdresse: stationAdresse,
          stationPrix: carbusTab,
        };

        let results = [infos];

        console.dir(results);

        // await page.close();
        resolve(results);

      }
      catch(err) {
        console.log(err);
        await page.close();
        resolve({message: err, website: 'mosaic'});
      }
    })
  },

  formatMosaicCarbus: async function(carbus) {
    return new Promise(async function(resolve, reject) {    
      try {
        let carbusListFormat = [];
        for (let i=0; i<carbus.length; i++) {
          console.log(carbus[i]);
          if (carbus[i].disrupt == false) {
            console.log('NOT DISRUPT');
            let carbuMosaicName = await module.exports.carbuNameConvertReverse(carbus[i].id_oil);
            console.log(carbuMosaicName);
            if (!carbuMosaicName) {
              console.log('NO NAME FOUND');
              continue;
            }
            else {
              let carbusListFormatItem = {
                carbuMosaicName: carbuMosaicName,
                carbuRoulezEcoId: carbus[i].id_oil
              };
              carbusListFormat.push(carbusListFormatItem);
            }
          }
        }
        console.dir(carbusListFormat);
        resolve(carbusListFormat);
      }
      catch(err) {
        console.log(err);
        resolve(err);
      }
    })
  },

  removeSpecialChars: async function(str) {
    try {
      return str.replace(/[^a-zA-Z0-9 ]/g, "");
    }
    catch (err) {
      console.log(err);
      return false;
    } 
  },

  carbuNameConvert: async function(carbuType, absentCarbus) {
    console.log('CARBU TYPE = '+carbuType);
    try {    
      let oil_id;
      if (carbuType == 'GO') {
        oil_id = 1;
        let indexToRemove = absentCarbus.indexes.findIndex((element) => element == '1');
        let indexTypeToRemove = absentCarbus.types.findIndex((element) => element == 'Gazole');
        let infosSupp = {
          carbuType: absentCarbus.types[indexTypeToRemove],
          carbuIndexRE: absentCarbus.indexes[indexToRemove],
          oilId: oil_id
        }
        absentCarbus.indexes.splice(indexToRemove, 1);
        absentCarbus.types.splice(indexTypeToRemove, 1);
        return infosSupp;
      }
      else if (carbuType == 'SP95' || carbuType == 'SP95E') {
        oil_id = 2;        
        let indexToRemove = absentCarbus.indexes.findIndex((element) => element == '2');
        let indexTypeToRemove = absentCarbus.types.findIndex((element) => element == 'SP95');
        let infosSupp = {
          carbuType: absentCarbus.types[indexTypeToRemove],
          carbuIndexRE: absentCarbus.indexes[indexToRemove],
          oilId: oil_id
        }
        absentCarbus.indexes.splice(indexToRemove, 1);
        absentCarbus.types.splice(indexTypeToRemove, 1);
        return infosSupp;
      }
      else if (carbuType == 'SP98') {
        oil_id = 3;        
        let indexToRemove = absentCarbus.indexes.findIndex((element) => element == '6');
        let indexTypeToRemove = absentCarbus.types.findIndex((element) => element == 'SP98');
        let infosSupp = {
          carbuType: absentCarbus.types[indexTypeToRemove],
          carbuIndexRE: absentCarbus.indexes[indexToRemove],
          oilId: oil_id
        }
        absentCarbus.indexes.splice(indexToRemove, 1);
        absentCarbus.types.splice(indexTypeToRemove, 1);
        return infosSupp;
      }   
      else if (carbuType == 'SP95E10') {
        oil_id = 4;        
        let indexToRemove = absentCarbus.indexes.findIndex((element) => element == '5');
        let indexTypeToRemove = absentCarbus.types.findIndex((element) => element == 'SP95-E10');
        let infosSupp = {
          carbuType: absentCarbus.types[indexTypeToRemove],
          carbuIndexRE: absentCarbus.indexes[indexToRemove],
          oilId: oil_id
        }
        absentCarbus.indexes.splice(indexToRemove, 1);
        absentCarbus.types.splice(indexTypeToRemove, 1);
        return infosSupp;
      }   
      else {
        return false;
      }
    }
    catch (err) {
      console.log(err);
      return false;
    }
  },

    // on converti les infos de la bdd (issus de roulez-eco) au "format" Mosaic 
    carbuNameConvertReverse: async function(carbuId) {
    return new Promise(function(resolve, reject) {    
      try {    
        let oil_id;
        if (carbuId === 1) {
          resolve(['GO']);
        }
        else if (carbuId === 2) {
          resolve(['SP95', 'SP95e']);
        }
        else if (carbuId === 3) {
          resolve(['E85']);
        }
        else if (carbuId === 4) {
          resolve(['GPLc']);
        }                           
        else if (carbuId === 5) {
          resolve(['SP95E10']);
        }   
        else if (carbuId === 6) {
          resolve(['SP98']);
        }   
        else {
          return false;
        }
      }
      catch (err) {
        console.log(err);
        return false;
      }
    })
  },

  testCredentials: async function(data) {
    return new Promise(async function(resolve, reject) {    
      console.dir(data);
      try {
        console.log('Started')
        const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
        console.log('Browser launched')
        const page = await browser.newPage();
        // console.log('Page launched')
        // console.log('PASSWORD = '+data['mosaic_password']);

        // await page.setRequestInterception(true);

        // page.on('request', request => {
        //   const requestUrl = request._url.split('?')[0].split('#')[0];
        //   if (
        //     blockedResourceTypes.indexOf(request.resourceType()) !== -1 ||
        //     skippedResources.some(resource => requestUrl.indexOf(resource) !== -1)
        //   ) {
        //     request.abort();
        //   } else {
        //     request.continue();
        //   }
        // });      

        await page.goto('https://www.mosaic.total.fr/', { waitUntil: 'load', timeout: 0 });
        await page.waitFor('#login');
        await page.type('#login', data['mosaic_username']);
        await page.type('#pwd', data['mosaic_password']);
        await page.click('input[name="submit"]');
        await page.waitFor(6000);
        let authentication_success = await page.$('.tetemenu');
        if (!authentication_success) {
          resolve({error: true, message: 'CREDENTIALS ERROR', website: 'mosaic'});
        }    
        else {
          resolve({error: false, message: 'TEST SUCCEED', website: 'mosaic'});
        }
      }
      catch(err) {
        console.log('CATCH');
        console.log(err);
        reject({error: true, message: 'Problème de connexion inconnu, veuillez recharger la page et réessayer', website: 'mosaic'});
      }
    })
  }
}