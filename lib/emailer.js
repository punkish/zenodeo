'use strict';

const nodemailer = require('nodemailer');
const config = require('config');
const emailer = config.get('emailer');
//console.log(emailer);

module.exports = async function main(opts) {

    //console.log(opts)
    //const {subject, message} = opts;

    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    //let testAccount = await nodemailer.createTestAccount();

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        //host: 'mail.plazi.org',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: emailer.user,
            pass: emailer.pass
        }
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: emailer.from,
        to: emailer.to,
        subject: opts.subject,
        text: opts.message
    });

    console.log("Message sent: %s", info.messageId);

}

