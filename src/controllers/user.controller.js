import UserService from '../services/user.service.js';

const UserController = {
    // GET /profile
    async getProfile(req, res) {
        // 1. Kiểm tra xem đã đăng nhập chưa?
        if (!req.session.user) {
            return res.redirect('/login'); // Chưa thì đá về login
        }

        // 2. Lấy ID từ session
        const userId = req.session.user.id;

        // 3. Gọi Service lấy dữ liệu
        const userProfile = await UserService.getProfile(userId);

        // 4. Render giao diện
        res.render('user/profile', {
            title: 'Thông tin tài khoản',
            profile: userProfile,
            path: '/profile' // Để active menu nếu cần
        });
    },

    // POST /profile/update (Xử lý cập nhật)
    async updateProfile(req, res) {
        if (!req.session.user) return res.redirect('/login');
        
        const userId = req.session.user.id;
        await UserService.updateProfile(userId, req.body);
        
        // Cập nhật lại session fullname nếu đổi tên
        req.session.user.fullname = req.body.HoTen;
        
        res.redirect('/profile'); // Load lại trang để thấy thay đổi
    }
};

export default UserController;