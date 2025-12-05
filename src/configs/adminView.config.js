const categoryConfig = {
    scripts: ['/js/category.admin.js'],
    entityName: 'thể loại',
    tablePartial: 'partials/category/tableCategory',
    modalAddPartial: 'partials/category/modalAddCategory',
    modalUpdatePartial: 'partials/category/modalUpdateCategory',
    hrefBase: '/admin/category/',
    apiBase: '/api/category',
    modalAddSelector: '#add-category-modal',
    modalAddId: 'add-category-modal',
    modalUpdateId: 'update-category-modal',
}

const authorConfig = {
    scripts: ['/js/author.admin.js'],
    entityName: 'tác giả',
    tablePartial: 'partials/author/tableAuthor',
    modalAddPartial: 'partials/author/modalAddAuthor',
    modalUpdatePartial: 'partials/author/modalUpdateAuthor',
    hrefBase: '/admin/author/',
    apiBase: '/api/author',
    modalAddSelector: '#add-author-modal',
    modalAddId: 'add-author-modal',
    modalUpdateId: 'update-author-modal',
}

const publisherConfig = {
    scripts: ['/js/publisher.admin.js'],
    entityName: 'nhà xuất bản',
    tablePartial: 'partials/publisher/tablePublisher',
    modalAddPartial: 'partials/publisher/modalAddPublisher',
    modalUpdatePartial: 'partials/publisher/modalUpdatePublisher',
    hrefBase: '/admin/publisher/',
    apiBase: '/api/publisher',
    modalAddSelector: '#add-publisher-modal',
    modalAddId: 'add-publisher-modal',
    modalUpdateId: 'update-publisher-modal',
}

const bookConfig = {
    scripts: ['/js/book.admin.js'],
    entityName: 'sách',
    tablePartial: 'partials/book/tableBook',
    modalAddPartial: 'partials/book/modalAddBook',
    // modalUpdatePartial: 'partials/book/modalUpdateBook',
    hrefBase: '/admin/book/',
    apiBase: '/api/book',
    modalAddSelector: '#add-book-modal',
    modalAddId: 'add-book-modal',
    modalUpdateId: 'update-book-modal',
}

const supplierConfig = {
    scripts: ['/js/supplier.admin.js'],
    entityName: 'nhà cung cấp',
    tablePartial: 'partials/supplier/tableSupplier',
    modalAddPartial: 'partials/supplier/modalSupplier',
    // modalUpdatePartial: 'partials/supplier/modalUpdateSupplier',
    hrefBase: '/admin/supplier/',
    apiBase: '/api/supplier',
    modalAddSelector: '#add-supplier-modal',
    modalAddId: 'add-supplier-modal',
    modalUpdateId: 'update-supplier-modal',
}

const importReceiptConfig = {
    scripts: ['/js/importReceipt.admin.js'],
    entityName: 'phiếu nhập',
    tablePartial: 'partials/importReceipt/tableImportReceipt',
    modalAddPartial: 'partials/importReceipt/modalImportReceipt',
    // modalUpdatePartial: 'partials/importReceipt/modalUpdateImportReceipt',
    hrefBase: '/admin/import-receipt/',
    apiBase: '/api/import-receipt',
    modalAddSelector: '#add-importReceipt-modal',
    modalAddId: 'add-importReceipt-modal',
    modalUpdateId: 'update-importReceipt-modal',
}

const exportReceiptConfig = {
    scripts: ['/js/exportReceipt.admin.js'],
    entityName: 'phiếu xuất',
    tablePartial: 'partials/exportReceipt/tableExportReceipt',
    modalAddPartial: 'partials/exportReceipt/modalExportReceipt',
    // modalUpdatePartial: 'partials/exportReceipt/modalUpdateExportReceipt',
    hrefBase: '/admin/export-receipt/',
    apiBase: '/api/export-receipt',
    modalAddSelector: '#add-exportReceipt-modal',
    modalAddId: 'add-exportReceipt-modal',
    modalUpdateId: 'update-exportReceipt-modal',
}

const orderConfig = {
    scripts: ['/js/order.admin.js'],
    entityName: 'đơn đặt hàng',
    tablePartial: 'partials/order/tableOrder',
    modalAddPartial: 'partials/order/modalOrder',
    // modalUpdatePartial: 'partials/order/modalUpdateOrder',
    hrefBase: '/admin/sale/order/',
    apiBase: '/api/sale/order',
    modalAddSelector: '#add-order-modal',
    modalAddId: 'add-order-modal',
    modalUpdateId: 'update-order-modal',
}

const invoiceConfig = {
    scripts: ['/js/invoice.admin.js'],
    entityName: 'hóa đơn',
    tablePartial: 'partials/invoice/tableInvoice',
    modalAddPartial: 'partials/invoice/modalInvoice',
    // modalUpdatePartial: 'partials/invoice/modalUpdateInvoice',
    hrefBase: '/admin/sale/invoice/',
    apiBase: '/api/sale/invoice',
    modalAddSelector: '#add-invoice-modal',
    modalAddId: 'add-invoice-modal',
    modalUpdateId: 'update-invoice-modal',
}

export {
    categoryConfig,
    authorConfig,
    publisherConfig,
    bookConfig,
    supplierConfig,
    importReceiptConfig,
    exportReceiptConfig,
    orderConfig,
    invoiceConfig,
}
