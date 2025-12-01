import multer from 'multer';
import fs from 'fs';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads'; 
        
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir); 
    },
    
    filename: function (req, file, cb) {
        const filename = Date.now() + '-' + file.originalname.replace(/\s/g, '_');
        cb(null, filename);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, 
    
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true); 
        } else {
            cb(new Error('Chỉ chấp nhận tệp hình ảnh (JPEG, PNG, GIF, v.v.).'), false); 
        }
    }
});

// 'fieldName' PHẢI KHỚP với tên trường file trong FormData của Frontend
export const createUploadMiddleware = (fieldName) => {
    return upload.single(fieldName)
}