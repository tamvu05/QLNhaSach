import crypto from 'crypto';
import https from 'https';
import config from '../configs/momo.config.js';

const MomoService = {
    createPaymentRequest: async (orderId, amount, orderInfo) => {
        const { partnerCode, accessKey, secretKey, endpoint, redirectUrl, ipnUrl, requestType, extraData, autoCapture, lang } = config;

        const requestId = String(orderId) + new Date().getTime();

        // Raw signature string
        const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

        // Create signature
        const signature = crypto.createHmac('sha256', secretKey)
            .update(rawSignature)
            .digest('hex');

        const requestBody = JSON.stringify({
            partnerCode,
            requestId,
            amount,
            orderId,
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

        // Send request to MoMo
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

        const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

        const generatedSignature = crypto.createHmac('sha256', secretKey)
            .update(rawSignature)
            .digest('hex');

        return generatedSignature === signature;
    }
};

export default MomoService;
