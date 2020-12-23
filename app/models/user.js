const paths = require('../../paths');
let db = require(paths.path_db+'dbInit');
const moment = require('moment');
const cryptojs = require('crypto');
const encrypt = require(paths.path_app_controllers+'encrypt');


exports.create = async function(datas) {
  return new Promise(async function(resolve, reject) {
    try {
      console.dir(datas);
      let date_now = moment().format();
      let buffer = await cryptojs.randomBytes(48); 
      let activation_token = buffer.toString("hex");
      let query = {
        name: 'add-user',
        text: `INSERT INTO users (first_name, last_name, street, cp, city, siret, 
              iban, registration_date, company_name, password, email, email_alert, tva_num, tel, 
              activation_token) 
              VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        values: [datas["first_name"], datas["last_name"], datas["street"], datas["cp"],
              datas["city"], datas["siret"], datas["iban"], date_now, 
              datas["company_name"], datas["password"], datas["email"], datas["email_alert"], 
              datas["tva_num"], datas["tel"], activation_token]
      };      
      console.log(query);
      await db.query(query);
      resolve(true);      
    }
    catch(err) {
      reject(err);
    }
  })
},

exports.createLight = async function(datas) {
  return new Promise(async function(resolve, reject) {
    let response = {};
    try {
      let emailVerifResult = await exports.emailVerification(datas.email);
      if (emailVerifResult === false) {      
        let date_now = moment().format();
        let buffer = await cryptojs.randomBytes(48); 
        let activation_token = buffer.toString("hex");
        let query = {
            name: 'add-user-light',
            text: `INSERT INTO users (email, email_alert, registration_date, activation_token, activated) 
                  VALUES($1, $2, $3, $4, $5)
                  RETURNING id, email, activation_token;`,
            values: [datas['email'], datas['email'], date_now, activation_token, false]
        };           
        let userResponse = await db.query(query);
        response.datas = userResponse.rows[0];
        response.codeError = 0;
        resolve(response);      
      }
      else {
        response.codeError = 1;
        resolve(response);
      }
    }
    catch(err) {
      console.log(err);
      reject(err);
    }
  })
},

exports.registration = async function(datas) {
  return new Promise(async function(resolve, reject) {
    try {
      console.dir(datas);
      let date_now = moment().format();
      let query = {
          name: 'user-registration',
          text: `UPDATE users set first_name = $1, last_name = $2, 
                tel = $3, password = $4 WHERE id = $5`,
          values: [datas['first_name'], datas['last_name'], datas['tel'], datas['password'], datas['id']]
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

exports.login = async function(datas) {
  return new Promise(async function(resolve, reject) {  
    let query = {
      name: 'user-login',
      text: `SELECT id, password FROM users WHERE email=$1 AND activated = TRUE`,
      values: [datas['email']]
    };       
    console.log(query);
    let resultPassword = await db.query(query);
    if (resultPassword.rowCount > 0) {
      let registeredPassword = resultPassword.rows[0].password;
      let id_user = resultPassword.rows[0].id;
      console.dir(registeredPassword);
      let matchPasswords = await encrypt.comparePassword(datas.password, registeredPassword);
      console.log(matchPasswords);
      if (matchPasswords === true) {
        resolve(id_user);
      }
      else {
        resolve(false);
      }
    } 
    else {
      resolve(false);
    }
  })
},

exports.update = async function(datas) {
  return new Promise(async function(resolve, reject) {
    try {
      console.dir(datas);
      let date_now = moment().format();
      let query = {
        name: 'update-user',
        text: `UPDATE users set first_name = $1, last_name = $2, 
              street = $3, cp = $4, city = $5, siret = $6, iban = $7, 
              company_name = $8, password = $9, email = $10, 
              tva_num = $11, tel = $12 
              WHERE id = $13`,
        values: [datas["first_name"], datas["last_name"], datas["street"], datas["cp"],
              datas["city"], datas["siret"], datas["iban"], date_now, 
              datas["company_name"], datas["password"], datas["email"], datas["tva_num"], 
              datas["tel"], datas['id']]
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

exports.updateInfos = async function(id_user, datas) {
  return new Promise(async function(resolve, reject) {
    try {
      console.dir(datas);
      let date_now = moment().format();
      let query = {
        name: 'update-user-infos',
        text: `UPDATE users set civil = $1, first_name = $2, last_name = $3, tel = $4 
              WHERE id = $5
              RETURNING civil, first_name, last_name, tel`,
        values: [datas["civil"], datas["first_name"], datas["last_name"], 
              datas["tel"], id_user]
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

exports.updatePassword = async function(id_user, datas) {
  return new Promise(async function(resolve, reject) {
    try {
      console.dir(datas);
      let encryptedPassword = await encrypt.cryptPassword(datas['password']);
      let query = {
        name: 'update-user-password',
        text: `UPDATE users set password = $1 WHERE id = $2
                RETURNING password`,
        values: [encryptedPassword, id_user]
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

exports.updateEmail = async function(id_user, new_email) {
  return new Promise(async function(resolve, reject) {
    try {
      let query = {
        name: 'update-user-email',
        text: `UPDATE users set email = $1 WHERE id = $2`,
        values: [new_email, id_user]
      };      
      console.log(query);
      await db.query(query);
      resolve(true);      
    }
    catch(err) {
      reject(err);
    }
  })
}, 

exports.updateEmailAlert = async function(id_user, email_alert) {
  return new Promise(async function(resolve, reject) {
    try {
      let query = {
        name: 'update-user-email-alert',
        text: `UPDATE users set email_alert = $1 WHERE id = $2`,
        values: [email_alert, id_user]
      };      
      console.log(query);
      await db.query(query);
      resolve(true);      
    }
    catch(err) {
      reject(err);
    }
  })
},

exports.updateEmailAlertEnabled = async function(id_user, email_alert) {
  return new Promise(async function(resolve, reject) {
    try {
      let query = {
        name: 'update-user-email-alert-enabled',
        text: `UPDATE users set email_alert_enabled = $1 WHERE id = $2`,
        values: [email_alert, id_user]
      };      
      console.log(query);
      await db.query(query);
      resolve(true);      
    }
    catch(err) {
      reject(err);
    }
  })
},   

exports.updateCompany = async function(id_user, datas) {
  return new Promise(async function(resolve, reject) {
    try {
      console.dir(datas);
      let date_now = moment().format();
      let query = {
        name: 'update-user-company',
        text: `UPDATE users set siret = $1, 
              company_name = $2, tva_num = $3, company_adresse = $4, 
              company_cp = $5, company_city = $6 
              WHERE id = $7
              RETURNING *`,
        values: [datas["siret"], datas["company_name"], 
        datas["tva_num"], datas["company_adresse"], 
        datas["company_cp"], datas["company_city"], id_user]
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

exports.getById = function(id) {
  return new Promise(async function(resolve, reject) { 
    let query = {
      name: 'get-user-by-id',
      text: `SELECT id, civil, first_name, last_name, street, cp, city, 
              siret, iban, free_mode, registration_date, 
              company_name, company_adresse, company_cp, 
              company_city, email, activated, tva_num, tel, email_alert, 
              email_alert_enabled, payment_method, cb_infos, sepa_infos, id_stripe 
              FROM users WHERE id = $1`,
      values: [id]
    };     
    console.log(query);
    try {
      let user = await db.query(query);
      if (user.rows.length > 0) {
        resolve(user.rows[0]);
      }
      else {
        resolve(false);
      }
    }
    catch(err) {
      resolve(false);
    }
  })
},

exports.getAll = function() {
  return new Promise(async function(resolve, reject) {  
    let query = {
      name: 'get-all-users',
      text: `SELECT id, civil, first_name, last_name, street, cp, city, siret, iban, free_mode, registration_date,
    company_name, email, activated, tva_num, tel FROM users`,
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
}

exports.getPaymentMethodId = function(user_id) {
  return new Promise(async function(resolve, reject) {  
    let query = {
      name: 'get-payment-method-id',
      text: `SELECT payment_method_id FROM users WHERE id = $1`,
      values: [user_id]
    };        
    try {
      let user = await db.query(query);
      resolve(user.rows[0].payment_method_id);
    }
    catch(err) {
      reject(err);
    }
  })  
}

exports.enablePayant = function(id) {
  return new Promise(async function(resolve, reject) { 
    let query = {
      name: 'enable-payant-user',
      text: `UPDATE users SET free_mode = 0 WHERE id = $1`,
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
}

exports.delete = function(id) {
  console.log(id);
  return new Promise(async function(resolve, reject) {
    let query = {
      name: 'delete-user',
      text: `DELETE FROM users WHERE id = ${id}`,
      values: [id]
    };          
    try {
      let response = await db.query(query);
      if (response.rowCount > 0) {
      	resolve(true);
      }
      else {
      	resolve(false);
      }
    }
    catch(err) {
      reject(err);
    }
  })
}

exports.checkActivationToken = async function(id, token) {
  return new Promise(async function(resolve, reject) {  
    let query = {
      name: 'check-activation-token-user',
      text: `SELECT activation_token FROM users WHERE id = $1`,
      values: [id]
    };       
    try {
      let response = await db.query(query);
      let responseToken = response.rows[0].activation_token;
      console.log(responseToken);
      console.log(token);
      if (token == responseToken) {
        console.log('MATCH !');
        resolve(true);
      }
      else {
        console.log('NO MATCH');
        resolve(false);
      }
    }
    catch(err) {
      reject(err);
    }  
  })
}

exports.activate = function(id) {
  return new Promise(async function(resolve, reject) {  
    let query = {
      name: 'activate-user',
      text: `UPDATE users SET activated = true WHERE id = $1`,
      values: [id]
    };  
    console.log(query);
    try {
      let response = await db.query(query);
      resolve(true);
    }
    catch(err) {
      reject(false);
    }  
  })
}

exports.confirm = async function(datas) {
  return new Promise(async function(resolve, reject) {  
    let encryptedPassword = await encrypt.cryptPassword(datas['password']);
    let query = {
      name: 'confirm-user',
      text: `UPDATE users SET first_name = $1, last_name = $2, tel = $3, password = $4,
            company_name = $5, company_adresse = $6, company_city = $7, company_cp = $8, 
            siret = $9, tva_num = $10, civil = $11
            WHERE id = $12 AND activation_token = $13
            RETURNING first_name, last_name, email`,
      values: [datas['first_name'], datas['last_name'], datas['tel'], encryptedPassword, 
      datas['company_name'], datas['company_adresse'], datas['company_city'], datas['company_cp'], 
      datas['siret'], datas['tva'], datas['civil'], datas['id_user'], datas['token']]
    };    
    console.log(query);
    try {
      let userConfirmation = await db.query(query);
      console.dir(userConfirmation);
      if (userConfirmation.rowCount > 0) {
        resolve(userConfirmation.rows[0]);
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

exports.emailVerification = async function(email) {
  return new Promise(async function(resolve, reject) { 
    let response = {};   
    console.dir(email);
    let query = `SELECT id, email, first_name, last_name FROM users WHERE email='${email}'`;
    let userInfos = await db.query(query);
    console.dir(userInfos);
    if (userInfos.rowCount > 0) {
      console.log('SUPP');
      let buffer = await cryptojs.randomBytes(48); 
      let reset_token = buffer.toString("hex");  
      console.log(reset_token);
      console.log(userInfos.rows[0].id);  
      let query_token = `UPDATE users 
      SET reset_password_token = '${reset_token}'
      WHERE id = ${userInfos.rows[0].id}
      RETURNING reset_password_token`;
      let resetTokenResponse = await db.query(query_token);
      response.id = userInfos.rows[0].id;
      response.email = userInfos.rows[0].email; 
      response.reset_password_token = reset_token;
      response.first_name = userInfos.rows[0].first_name;
      response.last_name = userInfos.rows[0].last_name;
      response.error = false;
      resolve(response);
    }
    else {
      resolve(false);
    }
  })
}

exports.checkResetToken = async function(reset_token) {
  return new Promise(async function(resolve, reject) {
  	try {	
	    let query = `SELECT id FROM users WHERE reset_password_token='${reset_token}'`;
	    console.log(query);
	    let result = await db.query(query);
	    if (result.rowCount > 0) {
	      resolve(result.rows[0]);
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

exports.resetPassword = async function(datas) {
  return new Promise(async function(resolve, reject) {  
    console.dir(datas);
    let encryptedPassword = await encrypt.cryptPassword(datas.password);
    let query = `UPDATE users SET password='${encryptedPassword}'
    WHERE id=${datas.id}`;
    console.log(query);
    let result = await db.query(query);
    if (result.rowCount > 0) {
      resolve(true);
    }
    else {
      reject(false);
    }
  })
}

exports.clearResetToken = async function(id) {
  return new Promise(async function(resolve, reject) {
    let query = `UPDATE users SET reset_password_token=NULL WHERE id=${id}`;
    let result = await db.query(query);
    if (result.rowCount > 0) {
      resolve(true);
    }
    else {
      reject(false);
    }
  })
}

exports.clearActivationToken = async function(id) {
  return new Promise(async function(resolve, reject) {
    let query = `UPDATE users SET activation_token = NULL WHERE id=${id}`;
    let result = await db.query(query);
    if (result.rowCount > 0) {
      resolve(true);
    }
    else {
      reject(false);
    }
  })
}

exports.getStripeId = async function(id) {
  return new Promise(async function(resolve, reject) {
    let query = {
      name: 'get-stripe-id',
      text: `SELECT id_stripe FROM users WHERE id=$1`,
      values: [id]
    };        
    console.log(query);
    try {
      let user = await db.query(query);
      console.dir(user);
      resolve(user.rows[0].id_stripe);
    }
    catch(err) {
      reject(err);
    }   
  })
}

exports.setStripeId = async function(user_id, stripe_id) {
  return new Promise(async function(resolve, reject) {
    let query = {
      name: 'set-stripe-id',
      text: `UPDATE Users SET id_stripe=$1 WHERE id=$2`,
      values: [stripe_id, user_id]
    };        
    console.log(query);
    try {
      let user = await db.query(query);
      console.dir(user);
      resolve();
    }
    catch(err) {
      reject(err);
    }   
  })
}

exports.setCreditCard = async function(datas, id_user) {
  return new Promise(async function(resolve, reject) {
    let card_infos = JSON.stringify(datas);
    let query = {
      name: 'set-credit-card',
      text: `UPDATE users SET payment_method = $1, cb_infos = $2 WHERE id = $3
      RETURNING id_stripe`,
      values: ['cb', card_infos, id_user]
    }
    console.log(query);
    try {
      await db.query(query);
      resolve();
    }
    catch(err) {
      reject(err);
    }
  })
}

exports.setSepa = async function(datas, id_user) {
  return new Promise(async function(resolve, reject) {
    let sepa_infos = JSON.stringify(datas);
    let query = {
      name: 'set-sepa',
      text: `UPDATE users SET payment_method = $1, sepa_infos = $2 WHERE id = $3
      RETURNING id_stripe`,
      values: ['sepa', sepa_infos, id_user]
    }
    console.log(query);
    try {
      await db.query(query);
      resolve();
    }
    catch(err) {
      reject(err);
    }
  })
}

exports.setPaymentMethodId = async function(payment_method_id, id_user) {
  return new Promise(async function(resolve, reject) {
    let query = {
      name: 'set-payment-method-id',
      text: `UPDATE users SET payment_method_id = $1 WHERE id = $2
      RETURNING id_stripe`,
      values: [payment_method_id, id_user]
    }
    console.log(query);
    try {
      await db.query(query);
      resolve();
    }
    catch(err) {
      reject(err);
    }
  })
}

