import jwt from "jsonwebtoken"
import nodemailer from "nodemailer";
import { config } from "./config/config.js";
import { logger } from "./logger.js";

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: config.GMAIL,
        pass: config.GMAIL_PASS
    }
});

export const sendWelcomeEmail = (toEmail) => {
    const mailOptions = {
        from: config.GMAIL,
        to: toEmail,
        subject: 'Bienvenido a mi aplicación',
        text: 'Gracias por registrarte en mi aplicación!',
        html: '<h1>Bienvenido!</h1><p>Gracias por registrarte en mi aplicación!</p>'
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return req.logger.error(error);
        }
        req.logger.info('Correo enviado: ' + info.response);
    });
};

export const sendResetPasswordEmail = (toEmail, token) => {
    const mailOptions = {
        from: config.GMAIL,
        to: toEmail,
        subject: 'Restablecimiento de Contraseña',
        html: `<h1>Restablecimiento de Contraseña</h1>
                <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
                <a href="http://localhost:8080/resetpassword/${token}">Restablecer Contraseña</a>`,
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            logger.error('Error enviando el correo:', error);
        } else {
            req.logger.info('Correo enviado:', info.response);
        }
    });
};

export const sendPurchaseEmail = async (ticket, userEmail) => {
    const mailOptions = {
        from: config.GMAIL,
        to: userEmail,
        subject: 'Confirmación de Compra',
        html: `<h1>Gracias por tu compra</h1>
                <p>Tu orden de compra:</p>
                <p><strong>ID del ticket:</strong> ${ticket._id}</p>
                <p><strong>Productos:</strong></p>
                <ul>
                ${ticket.products.map(p => `
                    <li>
                        <strong>Producto:</strong> ${p.product.title}<br>
                        <strong>Descripción:</strong> ${p.product.description}<br>
                        <strong>Precio:</strong> $${p.product.price}<br>
                        <strong>Cantidad:</strong> ${p.quantity}<br>
                    </li>
                `).join('')}
                </ul>
                <p><strong>Total:</strong> $${ticket.amount}</p>`
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            logger.error('Error enviando el correo:', error);
        } else {
            req.logger.info('Correo enviado:', info.response);
        }
    });
};