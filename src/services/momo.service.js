import crypto from 'crypto';
import https from 'https';
import config from '../configs/momo.config.js';

const MomoService = {
    createPaymentRequest: async (orderId, amount, orderInfo) => {
        const { partnerCode, accessKey, secretKey, endpoint, redirectUrl, ipnUrl, requestType, extraData, autoCapture, lang } = config;

        // Tạo requestId ngẫu nhiên (giữ nguyên logic cũ của cậu)
        const requestId = String(orderId) + new Date().getTime();

        // 🔥 [SỬA LỖI TRÙNG ORDER ID]
        // Tạo một mã giao dịch riêng cho MoMo bằng cách: ID Đơn Hàng + "_" + Thời gian hiện tại
        // Ví dụ: Đơn hàng 13 -> 13_170367890000
        const orderIdMomo = String(orderId) + '_' + new Date().getTime();

        // 🔥 [QUAN TRỌNG] Trong rawSignature phải dùng orderIdMomo
        const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderIdMomo}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

        const signature = crypto.createHmac('sha256', secretKey)
            .update(rawSignature)
            .digest('hex');

        // 🔥 [QUAN TRỌNG] Trong body gửi đi cũng phải dùng orderIdMomo
        const requestBody = JSON.stringify({
            partnerCode,
            requestId,
            amount,
            orderId: orderIdMomo, // Sử dụng mã unique vừa tạo
            orderInfo,
            redirectUrl,
            ipnUrl,
            lang,
            requestType,
            autoCapture,
            extraData,
            signature
        });

        console.log('MoMo Request Body:', requestBody);

        return new Promise((resolve, reject) => {
            const url = new URL(endpoint);
            const options = {
                hostname: url.hostname,
                port: 443,
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(requestBody)
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(e);
                    }
                });
            });

            req.on('error', (e) => {
                reject(e);
            });

            req.write(requestBody);
            req.end();
        });
    },

    verifySignature: (data) => {
        const { accessKey, secretKey } = config;
        const { partnerCode, orderId, requestId, amount, orderInfo, orderType, transId, resultCode, message, payType, responseTime, extraData, signature } = data;

        // Lưu ý: Lúc verify thì orderId ở đây chính là cái chuỗi dài "13_170..." do MoMo trả về
        // Ta vẫn verify bình thường để đảm bảo dữ liệu đúng
        const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

        const generatedSignature = crypto.createHmac('sha256', secretKey)
            .update(rawSignature)
            .digest('hex');

        return generatedSignature === signature;
    }
};

export default MomoService;