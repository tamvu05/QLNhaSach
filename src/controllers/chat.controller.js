import { GoogleGenerativeAI } from "@google/generative-ai";
import pool from "../configs/db.js";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const ChatController = {
    async chat(req, res) {
        try {
            const userMessage = req.body.message;

            // 1. Lấy dữ liệu sách để làm "kiến thức" cho AI
            // Chỉ lấy các trường cần thiết: Tên, Tác giả, Giá, Thể loại
            const [books] = await pool.query(`
                SELECT s.TenSach, t.TenTG, s.DonGia, tl.TenTL 
                FROM Sach s 
                JOIN TacGia t ON s.MaTG = t.MaTG 
                JOIN TheLoai tl ON s.MaTL = tl.MaTL
                LIMIT 50 
            `);
            
            // 2. Chuyển dữ liệu sách thành văn bản
            const contextData = books.map(b => 
                `- Sách: "${b.TenSach}" của tác giả ${b.TenTG}, giá ${b.DonGia} VNĐ, thể loại ${b.TenTL}`
            ).join("\n");

            // 3. Cấu hình "vai diễn" cho AI
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            
            const prompt = `
            Bạn là trợ lý ảo bán hàng của nhà sách "KingBook".
            Dưới đây là danh sách các cuốn sách hiện có tại cửa hàng:
            ${contextData}

            Nhiệm vụ của bạn:
            - Trả lời câu hỏi: "${userMessage}"
            - Chỉ gợi ý các sách có trong danh sách trên.
            - Trả lời ngắn gọn, thân thiện, dùng emoji.
            - Nếu khách hỏi sách không có, hãy xin lỗi và gợi ý sách khác cùng thể loại.
            `;

            // 4. Gửi lên Google Gemini
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            res.json({ reply: text });

        } catch (error) {
            console.error("Lỗi Chat AI:", error);
            res.status(500).json({ reply: "Hic, AI đang bận xíu. Bạn hỏi lại sau nhé! 🤖" });
        }
    }
};

export default ChatController;