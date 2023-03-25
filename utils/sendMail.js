import { createTransport } from "nodemailer";

export const sendMail = async (email, subject, text ) =>{
    console.log(process.env.SMTP_HOST);
    console.log(process.env.SMTP_PORT);
    console.log(process.env.SMTP_USER);
    console.log(process.env.SMTP_PASS);
    const transport = createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        service: 'gmail',
        auth:{
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        }
    });

    await transport.sendMail({
        from: process.env.SMTP_USER,
        to:email,
        subject,
        text,
    })
}