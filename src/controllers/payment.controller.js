import axios from 'axios';
import { createHmac } from 'node:crypto';

// Cấu hình MoMo
const momoParams = {
    partnerCode: process.env.MOMO_PARTNER_CODE || "MOMO",
    accessKey: process.env.MOMO_ACCESS_KEY,
    secretKey: process.env.MOMO_SECRET_KEY,
    endpoint: process.env.MOMO_ENDPOINT || "https://test-payment.momo.vn/v2/gateway/api/create",
    returnUrl: process.env.MOMO_RETURN_URL || "http://localhost:3000/payment/momo_return",
    notifyUrl: "http://localhost:3000/payment/momo_ipn"
};

// 1. Hàm tạo thanh toán
export const createPaymentMoMo = async (req, res) => {
    try {
        const orderId = "MOMO" + new Date().getTime();
        const requestId = orderId;
        const amount = '50000'; // Test
        const orderInfo = "Thanh toan don hang Test";
        const requestType = "captureWallet";
        const extraData = "";

        const rawSignature = `accessKey=${momoParams.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${momoParams.notifyUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${momoParams.partnerCode}&redirectUrl=${momoParams.returnUrl}&requestId=${requestId}&requestType=${requestType}`;

        console.log("Raw Signature:", rawSignature); // Log để kiểm tra nếu lỗi

        const signature = createHmac('sha256', momoParams.secretKey)
            .update(rawSignature)
            .digest('hex');

        const requestBody = {
            partnerCode: momoParams.partnerCode,
            partnerName: "Nha Sach Test",
            storeId: "MomoTestStore",
            requestId: requestId,
            amount: amount,
            orderId: orderId,
            orderInfo: orderInfo,
            redirectUrl: momoParams.returnUrl,
            ipnUrl: momoParams.notifyUrl,
            lang: 'vi',
            requestType: requestType,
            autoCapture: true,
            extraData: extraData,
            signature: signature
        };

        // momo api req
        const response = await axios.post(momoParams.endpoint, requestBody);

        console.log("MoMo Response:", response.data);

        if (response.data && response.data.payUrl) {
            // Neu thanh cong chuyen sang momo
            res.redirect(response.data.payUrl);
        } else {
            res.status(400).send('Lỗi tạo giao dịch MoMo: ' + JSON.stringify(response.data));
        }
    } catch (error) {
        console.error("Lỗi Server MoMo:", error.response ? error.response.data : error.message);
        res.status(500).send('Lỗi Server MoMo (Xem log để biết chi tiết)');
    }
};

// Thanh toan xong se ve web
export const momoReturn = (req, res) => {
    console.log("MoMo Return Params:", req.query);

    const { resultCode, message } = req.query;

    if (resultCode == '0') {
        res.send(`
            <div style="text-align: center; margin-top: 50px;">
                <h1 style="color: green;">Thanh toán thành công! ✅</h1>
                <p>${message}</p>
                <a href="/">Quay về trang chủ</a>
            </div>
        `);
    } else {
        res.send(`
            <div style="text-align: center; margin-top: 50px;">
                <h1 style="color: red;">Thanh toán thất bại ❌</h1>
                <p>Lý do: ${message}</p>
                <a href="/">Thử lại</a>
            </div>
        `);
    }
};