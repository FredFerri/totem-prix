const nodemailer = require('nodemailer');


module.exports = async function sendMail(recipient, type, message, datas) {
  var transporter = nodemailer.createTransport({
       service: 'gmail',
       port: 465,
       auth: {
              user: 'ferri.frederic33@gmail.com',
              pass: 'aby55inians',
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

  let html_message;
  if (type == 'error') {
    html_message = `<p>L'application Argos rencontre un problème concernant la récupération de vos prix : ${message}</p>`;
  }
  else {
    html_message = `<p>Vos tarifs ont bien été mis à jour sur la plateforme roulez-eco, voici le détail : 
    ${datas}</p>`;
  }

  var mailOptions = {
    from: 'ferri.frederic33@gmail.com', // sender address
    to: to, // list of receivers
    subject: 'Argos - information scraping', // Subject line
    html: html_message
  };

  console.log(mailOptions);

  transporter.sendMail(mailOptions, function (err, info) {
     if(err) {
        console.log(err)
     }
     else {
        console.log('MAILSENT !');
     }
  });   
}