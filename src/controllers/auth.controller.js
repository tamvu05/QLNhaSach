import AuthService from '../services/auth.service.js';

const AuthController = {
    // --- LOGIN / REGISTER (Giữ nguyên) ---
    loginPage(req, res) {
        if (req.session.user) return res.redirect('/');
        res.render('user/login', {
            title: 'Đăng nhập - BookStore',
            path: '/login',
            error: null
        });
    },

    registerPage(req, res) {
        if (req.session.user) return res.redirect('/');
        res.render('user/register', {
            title: 'Đăng ký - BookStore',
            path: '/register',
            error: null
        });
    },

    async handleRegister(req, res) {
        try {
            const { fullname, email, password, confirmPassword } = req.body;
            if (password !== confirmPassword) throw new Error('Mật khẩu nhập lại không khớp!');
            
            await AuthService.register({ fullname, email, password });
            res.redirect('/login');
        } catch (err) {
            res.render('user/register', {
                title: 'Đăng ký - BookStore', path: '/register', error: err.message
            });
        }
    },

    async handleLogin(req, res) {
        try {
            // Lấy thêm biến remember từ form
            const { email, password, remember } = req.body;

            const user = await AuthService.login(email, password);
            
            // Lưu thông tin vào session
            req.session.user = user;

            // --- LOGIC GHI NHỚ ĐĂNG NHẬP ---
            if (remember === 'on') {
                // Nếu tích: Gia hạn cookie lên 30 ngày
                req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; 
            } else {
                // Không tích: Để mặc định (theo cấu hình app.js là 24h)
                // Hoặc muốn tắt trình duyệt là mất thì set = null
                req.session.cookie.expires = null; 
            }
            // -------------------------------

            res.redirect('/');

        } catch (err) {
            res.render('user/login', {
                title: 'Đăng nhập - BookStore',
                path: '/login',
                error: err.message
            });
        }
    },

    logout(req, res) {
        req.session.destroy(() => {
            res.redirect('/');
        });
    },

    // --- [MỚI] QUÊN MẬT KHẨU ---
    // BƯỚC 1: Trang Nhập Email
    forgotPasswordPage(req, res) {
        res.render('user/forgot-password', { title: 'Quên mật khẩu', path: '/login', error: null });
    },

    async handleForgotPassword(req, res) {
        try {
            const { email } = req.body;
            await AuthService.sendOtp(email);
            
            // Gửi thành công -> Chuyển sang trang nhập mã (Truyền email theo để biết mã của ai)
            res.render('user/verify-code', { 
                title: 'Nhập mã xác minh', path: '/login', email, error: null 
            });
        } catch (error) {
            res.render('user/forgot-password', { title: 'Quên mật khẩu', path: '/login', error: error.message });
        }
    },

    // BƯỚC 2: Xử lý mã OTP
    async handleVerifyCode(req, res) {
        const { email, otp } = req.body;
        try {
            const isValid = await AuthService.verifyOtp(email, otp);
            if (!isValid) throw new Error('Mã xác minh không đúng hoặc đã hết hạn');

            // Mã đúng -> Chuyển sang trang đặt mật khẩu mới (Kèm email để biết đổi cho ai)
            res.render('user/reset-password', { 
                title: 'Đặt lại mật khẩu', path: '/login', email, error: null 
            });
        } catch (error) {
            // Sai mã -> Ở lại trang nhập mã
            res.render('user/verify-code', { 
                title: 'Nhập mã xác minh', path: '/login', email, error: error.message 
            });
        }
    },

    // BƯỚC 3: Đổi mật khẩu
    async handleResetPassword(req, res) {
        const { email, password, confirmPassword } = req.body;
        try {
            if (password !== confirmPassword) throw new Error('Mật khẩu không khớp');
            
            await AuthService.resetPassword(email, password);
            res.redirect('/login'); // Xong -> Về Login
        } catch (error) {
            res.render('user/reset-password', { 
                title: 'Đặt lại mật khẩu', path: '/login', email, error: error.message 
            });
        }
    }
};

export default AuthController;