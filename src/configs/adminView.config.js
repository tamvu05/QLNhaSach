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
    modalUpdatePartial: 'partials/book/modalUpdateBook',
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

export { categoryConfig, authorConfig, publisherConfig, bookConfig, supplierConfig }
