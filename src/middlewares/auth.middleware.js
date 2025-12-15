import AccountModel from '../models/account.model.js'

const checkLoginAdmin = async (req, res, next) => {
    const MaTK = req?.session?.account?.MaTK
    if (typeof MaTK === 'undefined') return res.redirect('/login/admin')
    const exist = await AccountModel.getById(MaTK)
    if (!exist) return res.redirect('/login/admin')

    res.locals.account = req.session.account
    next()
}

const isAdmin = (req, res, next) => {
    const VaiTro = req?.session?.account?.VaiTro
    if (typeof VaiTro === 'undefined' || VaiTro != 4) return res.redirect('/login/admin')
    next()
}

export { checkLoginAdmin, isAdmin }
