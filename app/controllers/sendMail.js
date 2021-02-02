const nodemailer = require('nodemailer');
const Email = require('email-templates');
const mailjet = require('node-mailjet').connect(
  process.env.MJ_APIKEY_PUBLIC,
  process.env.MJ_APIKEY_PRIVATE
);

module.exports = {

  sendMailJet: async function(userEmail, userName, type, datas) {
    return new Promise(function(resolve, reject) {    
      let subject;
      let templateId;
      let variables;
      if (type == 'inscription') {
        subject = 'Finalisez votre inscription à totem-prix';
        templateId = 2030479;
        variables = {
          lien_activation: datas
        };
      }
      else if (type == 'inscription-confirmation') {
        subject = 'Inscription confirmée !';
        templateId = 2031216;
      }
      else if (type == 'daily-confirmation') {
        subject = 'Vos prix carburants ont été mis à jour !';
        templateId = 2089876;
      }
      else if (type == 'daily-error') {
        subject = 'Erreur rencontrée lors de la mise à jour de vos prix carburants';
        templateId = 2103513;
      }      
      else {
        subject = 'Demande de réinitialisation de votre mot de passe totem-prix';
        templateId = 2031269;
        variables = {
          reset_password: datas
        };        
      }

      console.log(userEmail);
      console.log(userName);
      console.dir(variables);
      const request = mailjet.post('send', { version: 'v3.1' }).request({
        "Messages":[
          {
            "From": {
              "Email": "contact@totem-prix.com",
              "Name": "Totem-prix"
            },
            "To": [
              {
                "Email": userEmail,
                "Name": userName
              }
            ],
            "TemplateID": templateId,
            "TemplateLanguage": true,
            "Subject": subject,
            "Variables": variables
          }
        ]
      })
      request
        .then(result => {
          console.log(result.body)
          resolve(true);
        })
        .catch(err => {
          console.dir(err)
          resolve(err);
        })    
    })
  },

  sendMail: async function(recipient, type, datas) {
    var transporter = nodemailer.createTransport({
         service: 'gmail',
         port: 465,
         auth: {
                user: 'contact@totem-prix.com',
                pass: 'argos!MFJ176',
            },
              secure: true,    
        });

    let to;
    if (recipient == 'admin') {
      to = 'ferri.frederic@yahoo.fr'
    }
    else {
      to = recipient;
    }

    const email = new Email({
      transport: transporter,
      send: true,
      preview: false,
      views: {
        options: {
          extension: 'ejs',
        },
      },
    });
        

    // let html_message;
    // if (type == 'error') {
    //   html_message = `<p>L'application Argos rencontre un problème concernant la récupération de vos prix : ${message}</p>`;
    // }
    // else {
    //   html_message = `<p>Vos tarifs ont bien été mis à jour sur la plateforme roulez-eco, voici le détail : 
    //   ${datas}</p>`;
    // }

    // var mailOptions = {
    //   from: 'contact@totem-prix.com', // sender address
    //   to: to, // list of receivers
    //   subject: 'totem-prix - Informations', // Subject line
    //   html: html_message
    // };

  if (type == 'inscription') {  
    email
      .send({
        template: 'inscription',
        message: {
          to: to,
          attachments: [
            {
              infos: {confirmationUrl: datas}
            }
          ]
        }
      })
      .then(console.log)
      .catch(console.error);
  }

  else if (type == 'inscription-confirmation') {
    email
      .send({
        template: 'inscription-confirmation',
        message: {
          to: to,
          attachments: [
            {
              infos: {userName: datas}
            }
          ]
        }
      })
      .then(console.log)
      .catch(console.error);
  }

  else if (type == 'reset-password') {
    email
      .send({
        template: 'reset-password',
        message: {
          to: to,
          attachments: [
          ]
        },
        locals: {
          locale: 'fr',
          resetUrl: datas
        }
      })
      .then(console.log)
      .catch(console.error);
  }

  else if (type == 'daily-confirmation') {
    email
      .send({
        template: 'reset-password',
        message: {
          to: to,
          attachments: [
          ]
        },
        locals: {
          locale: 'fr',
          resetUrl: datas
        }
      })
      .then(console.log)
      .catch(console.error);
  }  

  else {
    console.log('WRONG TYPE');
  }



    // transporter.sendMail(mailOptions, function (err, info) {
    //    if(err) {
    //       console.log(err)
    //    }
    //    else {
    //       console.log('MAILSENT !');
    //    }
    // });   
  },

  sendConfirmationMail : function(userDatas) {
    return new Promise(async function(resolve, reject) {
      let confirmationUrl = `totem-prix.com:8080/user-activation/${userDatas.id}/${userDatas.activation_token}/`;
      console.log(`CONFIRMATION URL = ${confirmationUrl}`);
      resolve(confirmationUrl);
    })
  },

  sendResetPasswordEmail : function(datas) {
    return new Promise(async function(resolve, reject) {  
      console.log('RESET PASSWORD MAIL SENT TO '+datas.email);
      console.log(`REINIT URL = argos-dev.com:8080/password-reset/${datas.id}/${datas.reset_password_token}`);
      resolve(true);
    })
  }

}