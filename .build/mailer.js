"use strict";
const nodemailer = require("nodemailer");
async function main() {
  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 465,
    secure: true,
    auth: {
      user: process.env["emlusr"],
      pass: process.env["emlpwd"]
    }
  });
  let info = await transporter.sendMail({
    from: '"Fred Foo \u{1F47B}" <foo@example.com>',
    to: "bar@example.com, baz@example.com",
    subject: "Hello \u2714",
    text: "Hello world?",
    html: "<b>Hello world?</b>"
  });
  console.log("Message sent: %s", info.messageId);
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}
main().catch(console.error);
//# sourceMappingURL=mailer.js.map
