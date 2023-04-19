var nodemailer = require('nodemailer');

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
  var transporter = nodemailer.createTransport({
    service: "hotmail",
    auth: {
        user: "betaos-systems@hotmail.com",
        pass: process.env['emlpwd']
    }
  });
  
  // setup e-mail data, even with unicode symbols
  var mailOptions = {
      from: '"Our Code World " <betaos-systems@protonmail.com>', // sender address (who sends)
      to: 'betaos-services@gmail.com', // list of receivers (who receives)
      subject: 'Hello ', // Subject line
      text: 'Hello world ', // plaintext body
      html: '<b>Hello world </b><br> This is the first email sent with Nodemailer in Node.js' // html body
  };
  
  // send mail with defined transport object
  transporter.sendMail(mailOptions, function(error:any, info:any){
      if(error){
          return console.log(error);
      }
  
      console.log('Message sent: ' + info.response);
  });
} 