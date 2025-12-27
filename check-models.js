import dotenv from 'dotenv';
dotenv.config();

async function checkModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        console.log("❌ Lỗi: Chưa tìm thấy GEMINI_API_KEY trong file .env");
        return;
    }

    console.log("🔄 Đang kết nối đến Google để lấy danh sách Model...");
    
    try {
        // Gọi trực tiếp API của Google để xem danh sách
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.error) {
            console.error("❌ Lỗi API Key:", data.error.message);
        } else {
            console.log("✅ KẾT NỐI THÀNH CÔNG! Dưới đây là các Model bạn được dùng:");
            console.log("-------------------------------------------------------");
            // Lọc ra các model hỗ trợ generateContent
            const models = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
            models.forEach(m => {
                console.log(`👉 Tên model: ${m.name.replace('models/', '')}`);
            });
            console.log("-------------------------------------------------------");
            console.log("💡 Hãy copy một trong các tên ở trên và dán vào file chat.controller.js");
        }
    } catch (error) {
        console.error("❌ Lỗi kết nối:", error.message);
    }
}

checkModels();