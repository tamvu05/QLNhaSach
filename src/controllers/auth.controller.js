import AuthService from '../services/auth.service.js'

const AuthController = {
    // --- LOGIN / REGISTER ---
    loginPage(req, res) {
        if (req.session.user) return res.redirect('/')
        res.render('user/login', {
            title: 'Đăng nhập - BookStore',
            path: '/login',
            error: null,
        })
    },

    registerPage(req, res) {
        if (req.session.user) return res.redirect('/')
        res.render('user/register', {
            title: 'Đăng ký - BookStore',
            path: '/register',
            error: null,
        })
    },

    // CẬP NHẬT HÀM NÀY ĐỂ HIỂN THỊ POPUP THÀNH CÔNG
    async handleRegister(req, res) {
        try {
            const { fullname, email, password, confirmPassword } = req.body
            if (password !== confirmPassword) throw new Error('Mật khẩu nhập lại không khớp!')

            await AuthService.register({ fullname, email, password })
            
            // Thay vì redirect ngay, ta render trang Login kèm thông báo
            res.render('user/login', {
                title: 'Đăng nhập - BookStore',
                path: '/login',
                error: null,
                alert: {
                    type: 'success',
                    title: 'Đăng ký thành công!',
                    message: 'Tài khoản của bạn đã được tạo. Vui lòng đăng nhập.'
                }
            })
        } catch (err) {
            res.render('user/register', {
                title: 'Đăng ký - BookStore',
                path: '/register',
                error: err.message,
            })
        }
    },

    async handleLogin(req, res) {
        try {
            const { email, password, remember } = req.body
            const user = await AuthService.login(email, password)

            req.session.user = user

            // Logic ghi nhớ đăng nhập
            if (remember === 'on') {
                req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000
            } else {
                req.session.cookie.expires = null
            }

            res.redirect('/')
        } catch (err) {
            res.render('user/login', {
                title: 'Đăng nhập - BookStore',
                path: '/login',
                error: err.message,
            })
        }
    },

    logout(req, res) {
        req.session.destroy(() => {
            res.clearCookie('connect.sid')
            res.redirect('/')
        })
    },

    // GET /api/auth/logout
    async logoutAdmin(req, res) {
        req.session.destroy((err) => {
            if (err) {
                console.error(err)
                return res.status(500).send('Logout failed')
            }
            res.redirect('/login/admin')
        })
    },

    // --- QUÊN MẬT KHẨU ---
    forgotPasswordPage(req, res) {
        res.render('user/forgot-password', { title: 'Quên mật khẩu', path: '/login', error: null })
    },

    async handleForgotPassword(req, res) {
        try {
            const { email } = req.body
            await AuthService.sendOtp(email)

            res.render('user/verify-code', {
                title: 'Nhập mã xác minh',
                path: '/login',
                email,
                error: null,
            })
        } catch (error) {
            res.render('user/forgot-password', { title: 'Quên mật khẩu', path: '/login', error: error.message })
        }
    },

    async handleVerifyCode(req, res) {
        const { email, otp } = req.body
        try {
            const isValid = await AuthService.verifyOtp(email, otp)
            if (!isValid) throw new Error('Mã xác minh không đúng hoặc đã hết hạn')

            res.render('user/reset-password', {
                title: 'Đặt lại mật khẩu',
                path: '/login',
                email,
                error: null,
            })
        } catch (error) {
            res.render('user/verify-code', {
                title: 'Nhập mã xác minh',
                path: '/login',
                email,
                error: error.message,
            })
        }
    },

    async handleResetPassword(req, res) {
        const { email, password, confirmPassword } = req.body
        try {
            if (password !== confirmPassword) throw new Error('Mật khẩu không khớp')

            await AuthService.resetPassword(email, password)
            
            // Đổi mật khẩu thành công cũng hiện popup luôn cho xịn
            res.render('user/login', {
                title: 'Đăng nhập - BookStore',
                path: '/login',
                error: null,
                alert: {
                    type: 'success',
                    title: 'Đổi mật khẩu thành công!',
                    message: 'Vui lòng đăng nhập bằng mật khẩu mới.'
                }
            })
        } catch (error) {
            res.render('user/reset-password', {
                title: 'Đặt lại mật khẩu',
                path: '/login',
                email,
                error: error.message,
            })
        }
    },

    // ADMIN LOGIN
    async loginAdminPage(req, res, next) {
        try {
            res.render('admin/login', {
                layout: false,
            })
        } catch (error) {
            next(error)
        }
    },

    async loginAdmin(req, res, next) {
        try {
            const { email, password } = req.body
            const account = await AuthService.loginAdmin(email, password)
            if (account) req.session.account = account
            res.json(account)
        } catch (error) {
            next(error)
        }
    },
}

export default AuthController