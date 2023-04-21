var nodemailer = require('nodemailer');
let fs = require('fs');
// Create the transporter with the required configuration for Outlook
// change the user and pass !
export function sendMail() {
  // var transporter = nodemailer.createTransport({
  //     host: "smtp.office365.com", // hostname
  //     secureConnection: true, // TLS requires secureConnection to be false
  //     port: 587, // port for secure SMTP
  //     // tls: {
  //        // ciphers:'SSLv3'
  //     // },
  //     auth: {
  //         user: 'outlook_6F821D19C58C4CEF@outlook.com',
  //         pass: process.env['emlpwd']
  //     }
  // });
  // var transporter = nodemailer.createTransport({
  //   service: "gmail",
  //   auth: {
  //       user: "betaos.services@gmail.com",
  //       pass: process.env['emlpwd']
  //   }
  // });

  let transporter = nodemailer.createTransport({
    pool: true,
    host: "smtp.gmail.com",
    port: 587,
    secure: true, // use TLS
    auth: {
      user: "betaos.services@gmail.com",
      pass: process.env['emlpwd'],
    },
  });

  
  // setup e-mail data, even with unicode symbols
  var mailOptions = {
      from: '"BetaOS System AutoMailer" <betaos.services@gmail.com>', // sender address (who sends)
      to: 'betatester1025@protonmail.com', // list of receivers (who receives)
      subject: 'This is a test.', // Subject line
      text: 'Testing.', // plaintext body
      html: fs.readFileSync('./mailtemplate.html') // html body
  };
  
  // send mail with defined transport object
  transporter.sendMail(mailOptions, function(error:any, info:any){
      if(error){
          return console.log(error);
      }
  
      console.log('Message sent: ' + info.response);
  });
} 