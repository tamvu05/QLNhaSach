import pool from '../configs/db.js'

const DashboardService = {
    async getTotalBooks() {
        try {
            const [rows] = await pool.query('SELECT COUNT(*) AS total FROM Sach')
            return rows[0]?.total || 0
        } catch (err) {
            console.error('Error getting total books:', err)
            return 0
        }
    },

    async getTotalInvoices() {
        try {
            const [rows] = await pool.query('SELECT COUNT(*) AS total FROM HoaDon')
            return rows[0]?.total || 0
        } catch (err) {
            console.error('Error getting total invoices:', err)
            return 0
        }
    },

    async getRevenueThisMonth() {
        try {
            // Revenue from invoices (HoaDon) this month
            const [invoiceRevenue] = await pool.query(`
                SELECT COALESCE(SUM(TongTien), 0) AS total 
                FROM HoaDon 
                WHERE YEAR(NgayTaoHoaDon) = YEAR(CURDATE()) 
                AND MONTH(NgayTaoHoaDon) = MONTH(CURDATE())
                AND TrangThai IN ('DA_THANH_TOAN')
            `)

            // Revenue from export receipts (PhieuXuat) this month - sum of CTPhieuXuat amounts
            const [exportRevenue] = await pool.query(`
                SELECT COALESCE(SUM(CTPhieuXuat.SoLuong * CTPhieuXuat.DonGiaXuat), 0) AS total 
                FROM PhieuXuat
                JOIN CTPhieuXuat ON PhieuXuat.MaPX = CTPhieuXuat.MaPX
                WHERE YEAR(PhieuXuat.NgayXuat) = YEAR(CURDATE()) 
                AND MONTH(PhieuXuat.NgayXuat) = MONTH(CURDATE())
                AND PhieuXuat.TrangThai = 'HIEU_LUC'
            `)

            const invoiceTotal = Number(invoiceRevenue[0]?.total || 0)
            const exportTotal = Number(exportRevenue[0]?.total || 0)
            const total = invoiceTotal + exportTotal

            return total
        } catch (err) {
            console.error('Error getting revenue:', err)
            return 0
        }
    },

    async getRecentBooks(limit = 4) {
        try {
            const [rows] = await pool.query(`
                SELECT 
                    MaSach,
                    TenSach,
                    DonGia,
                    TacGia.TenTG as TenTacGia
                FROM Sach
                LEFT JOIN TacGia ON Sach.MaTG = TacGia.MaTG
                ORDER BY MaSach DESC
                LIMIT ?
            `, [limit])
            return rows || []
        } catch (err) {
            console.error('Error getting recent books:', err)
            return []
        }
    },

    async getTotalAuthors() {
        try {
            const [rows] = await pool.query('SELECT COUNT(*) AS total FROM TacGia')
            return rows[0]?.total || 0
        } catch (err) {
            console.error('Error getting total authors:', err)
            return 0
        }
    },

    async getTotalCategories() {
        try {
            const [rows] = await pool.query('SELECT COUNT(*) AS total FROM TheLoai')
            return rows[0]?.total || 0
        } catch (err) {
            console.error('Error getting total categories:', err)
            return 0
        }
    },

    async getTotalPublishers() {
        try {
            const [rows] = await pool.query('SELECT COUNT(*) AS total FROM NhaXuatBan')
            return rows[0]?.total || 0
        } catch (err) {
            console.error('Error getting total publishers:', err)
            return 0
        }
    },

    async getLowStockBooks(threshold = 10) {
        try {
            const [rows] = await pool.query(`
                SELECT COUNT(*) AS total FROM Sach WHERE SoLuongTon <= ?
            `, [threshold])
            return rows[0]?.total || 0
        } catch (err) {
            console.error('Error getting low stock books:', err)
            return 0
        }
    },

    async getLowStockBooksList(threshold = 10, limit = 5) {
        try {
            const [rows] = await pool.query(`
                SELECT 
                    MaSach,
                    TenSach,
                    SoLuongTon,
                    DonGia
                FROM Sach 
                WHERE SoLuongTon <= ?
                ORDER BY SoLuongTon ASC
                LIMIT ?
            `, [threshold, limit])
            return rows || []
        } catch (err) {
            console.error('Error getting low stock books list:', err)
            return []
        }
    },

    async getNewOrders(limit = 5) {
        try {
            const [rows] = await pool.query(`
                SELECT 
                    DonHang.MaDH,
                    DonHang.NgayDat,
                    DonHang.TenNguoiNhan,
                    DonHang.TongTien,
                    DonHang.TrangThai
                FROM DonHang
                ORDER BY DonHang.NgayDat DESC
                LIMIT ?
            `, [limit])
            return rows || []
        } catch (err) {
            console.error('Error getting new orders:', err)
            return []
        }
    },

    async getDashboardStats() {
        try {
            const [totalBooks, totalInvoices, revenueThisMonth, recentBooks, totalAuthors, totalCategories, totalPublishers, lowStockBooks, lowStockBooksList, newOrders] = await Promise.all([
                this.getTotalBooks(),
                this.getTotalInvoices(),
                this.getRevenueThisMonth(),
                this.getRecentBooks(4),
                this.getTotalAuthors(),
                this.getTotalCategories(),
                this.getTotalPublishers(),
                this.getLowStockBooks(),
                this.getLowStockBooksList(10, 5),
                this.getNewOrders(5),
            ])

            return {
                totalBooks,
                totalInvoices,
                revenueThisMonth,
                recentBooks,
                totalAuthors,
                totalCategories,
                totalPublishers,
                lowStockBooks,
                lowStockBooksList,
                newOrders,
            }
        } catch (err) {
            console.error('Error getting dashboard stats:', err)
            return {
                totalBooks: 0,
                totalInvoices: 0,
                revenueThisMonth: 0,
                recentBooks: [],
                totalAuthors: 0,
                totalCategories: 0,
                totalPublishers: 0,
                lowStockBooks: 0,
                lowStockBooksList: [],
                newOrders: [],
            }
        }
    },
}

export default DashboardService
