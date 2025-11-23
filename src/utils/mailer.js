// src/utils/mailer.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// 1. Tạo Transporter (người vận chuyển)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

// 2. Hàm gửi mail
export const sendMail = async (to, subject, htmlContent) => {
    try {
        const mailOptions = {
            from: `"BookStore Support" <${process.env.MAIL_USER}>`, // Tên người gửi
            to: to, // Gửi đến ai?
            subject: subject, // Tiêu đề
            html: htmlContent // Nội dung (dạng HTML)
        };

        await transporter.sendMail(mailOptions);
        console.log('📧 Email đã được gửi thành công đến: ' + to);
        return true;
    } catch (error) {
        console.error('❌ Lỗi gửi email:', error);
        return false;
    }
};