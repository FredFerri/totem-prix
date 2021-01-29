const puppeteer = require('puppeteer');
const cheerio = require('cheerio');


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
  launch: async function(page, credentials, carbuDatas, absentCarbus) {
      return new Promise(async function(resolve, reject) {  
        try {
          console.log('ROULEZ ECO');
          console.dir(carbuDatas);
          await page.setDefaultNavigationTimeout(0);
          await page.goto('https://gestion.roulez-eco.fr/', {waitUntil: 'load', timeout: 0});
          await page.type('#username', credentials.roulezeco_username);
          await page.type('#password', credentials.roulezeco_password);
          await page.click('input[name="_submit"]');
          await page.waitFor(10000);

          console.log('OKKKK 1');

          // await page.waitFor('.majcarbu_fieldset', { visible: true });

          let authentication_success = await page.$('.majcarbu_fieldset');
          console.dir(authentication_success);
          if (!authentication_success) {
            reject({message: 'CREDENTIALS ERROR', website: 'roulezeco'});
            await page.close();
          }

          else {

            console.log('OKKKK 2');

            await page.evaluate(function(carbuDatas, absentCarbus) {
                for (let z=0; z<carbuDatas.stationPrix.length; z++) {
                  let indexCarbu = carbuDatas.stationPrix[z].carbuIndexRE;
                  // On vérifie si l'élément ci dessous existe (si l'input du carburant en question est bien présent)
                  // car si il a été déclaré en rupture, il sera absent
                  if (document.querySelector('#fuel_'+indexCarbu)) {                  
                    let indexHtml = indexCarbu - 1;
                    let prixEuros = carbuDatas.stationPrix[z].carbuPrice.split('.')[0];
                    let prixCents = carbuDatas.stationPrix[z].carbuPrice.split('.')[1];
                    let blockCarbu = document.querySelector('#fuel_'+indexCarbu).parentNode.parentNode;
                    if (blockCarbu.querySelector('#fuel_'+indexCarbu).checked == true) {
                      blockCarbu.querySelector('#fuel_'+indexCarbu).click();
                    }
                    document.querySelector('#maj_prix_prices_'+indexHtml+'_euro').value = prixEuros;
                    document.querySelector('#maj_prix_prices_'+indexHtml+'_cents').value = prixCents;
                  }
                }

                for (absentCarbuId of absentCarbus) {
                  if (document.querySelector('#fuel_'+absentCarbuId).checked != true) {
                    document.querySelector('#fuel_'+absentCarbuId).click();
                  }
                }

            }, carbuDatas, absentCarbus.indexes)

            console.log('OKKKK 3');

            await page.waitFor(2000);
            await page.click('.submitForm > .btn_submit');
            await page.waitFor('#recap');
            await page.click('.btn_submit[type="submit"]');
            await page.waitFor(2000);          
            console.log('OKKKK 4');  
            await page.close();
            resolve(true);
          }

        }
        catch(err) {
          reject({message: err, website: 'roulezeco'});
        }
    })
  },

  testCredentials: async function(data) {
    return new Promise(async function(resolve, reject) {
      try {

          console.log('Started')
          const browser = await puppeteer.launch({headless:true});
          console.log('Browser launched')
          const page = await browser.newPage();
          console.log('Page launched')

          await page.setRequestInterception(true);

          page.on('request', request => {
            const requestUrl = request._url.split('?')[0].split('#')[0];
            if (
              blockedResourceTypes.indexOf(request.resourceType()) !== -1 ||
              skippedResources.some(resource => requestUrl.indexOf(resource) !== -1)
            ) {
              request.abort();
            } else {
              request.continue();
            }
          });     
                
          await page.goto('https://gestion.roulez-eco.fr/');
          await page.type('#username', data['roulezeco_username']);
          await page.type('#password', data['roulezeco_password']);
          await page.click('input[name="_submit"]');
          await page.waitFor(6000);

          // await page.waitFor('.majcarbu_fieldset', { visible: true });

          let authentication_success = await page.$('.majcarbu_fieldset');
          if (!authentication_success) {
            resolve({error: true, message: 'CREDENTIALS ERROR', website: 'roulezeco'});
          }   
          else {
            resolve({error: false, message: 'TEST SUCCEED', website: 'roulezeco'});
          }     
      }
      catch(err) {
        console.log(err);
        reject(err);
      }
    })
  },

  setOilBreak: async function(data) {
    return new Promise(async function(resolve, reject) {
      try {
        const browser = await puppeteer.launch({headless:true});
        console.log('Browser launched')
        const page = await browser.newPage();
        console.log('Page launched');
        console.dir(data);
        await page.goto('https://gestion.roulez-eco.fr/');
        await page.type('#username', data.roulezeco_username);
        await page.type('#password', data.roulezeco_password);
        await page.click('input[name="_submit"]');
        await page.waitFor(6000);

        let authentication_success = await page.$('.majcarbu_fieldset');
        console.dir(authentication_success);
        if (!authentication_success) {
          reject({message: 'CREDENTIALS ERROR', website: 'roulezeco'});
          await page.close();
        }

        else {
          await page.click('#smenu > ul > li:nth-child(2) > a');
          await page.waitFor('.section-carburant');
          console.dir(data);
          let disruptOils = data.disruptInfos;
          console.dir(disruptOils);
          console.log(disruptOils.length);
          await page.evaluate(function(disruptOils) {
            for (let i=0; i<disruptOils.length; i++) {
              let oilBtn = document.getElementById('fuel_'+disruptOils[i].idOil);
              let oilIsDisrupt = disruptOils[i].disruptOil;
              if (oilIsDisrupt == 'false') {
                if ($(oilBtn).is(':checked')) {
                  oilBtn.click();
                }
              }
              else if (oilIsDisrupt == 'true') {
                if (!$(oilBtn).is(':checked')) {
                  oilBtn.click();
                }
              }
            }
          }, disruptOils)
          await page.click('#submitButtonRuptureForm');
          await page.waitFor('.flash-notice');
          resolve({error: false, message: 'OIL DISRUPT SUCCEED', website: 'roulezeco'});
          }   
      }
      catch(err) {
        console.log('ERREUR 1');
        reject({error: true, message: err, website: 'roulezeco'});
      }
    })    
  },

  detectOils: async function(roulezeco_username, roulezeco_password) {
    return new Promise(async function(resolve, reject) {
      try {
        const browser = await puppeteer.launch({headless:true});
        console.log('Browser launched')
        const page = await browser.newPage();
        console.log('Page launched');
        await page.goto('https://gestion.roulez-eco.fr/');
        await page.type('#username', roulezeco_username);
        await page.type('#password', roulezeco_password);
        await page.click('input[name="_submit"]');
        await page.waitFor(6000);

        await page.waitFor('.majcarbu_fieldset', { visible: true });

        let authentication_success = await page.$('.majcarbu_fieldset');
        console.dir(authentication_success);
        if (!authentication_success) {
          reject({error: true, message: 'CREDENTIALS ERROR', website: 'roulezeco'});
          await page.close();
        }

        else {
          await page.click('#smenu > ul > li:nth-child(2) > a');
          await page.waitFor('.section-carburant');
          let oils = await page.evaluate(function(disruptOils) {
            let oils = [];
            $('#formulaire-rupture-carburant .section-carburant').each(function() {
              let oil_id = $(this).find('input').attr('id');
              oil_id = oil_id.replace('fuel_', '');
              let oil_name = $(this).find('label').text();
              let oilIsDisrupt;
              if ($(this).find('input').is(':checked')) {
                oilIsDisrupt = true;
              }
              else {
                oilIsDisrupt = false;
              }
              oils.push({'id': oil_id, 'name': oil_name, 'disrupt': oilIsDisrupt});
            })
            return oils;
          })
          console.dir(oils);
          resolve({error: false, message: 'DETECT OILS SUCCEED', website: 'roulezeco', oils: oils});
        }      
    }
    catch(err) {
      console.log(err);
      reject({error: true, message: err, website: 'roulezeco'});
    }
  })
  }

}; 