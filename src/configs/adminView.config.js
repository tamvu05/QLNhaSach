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

export { categoryConfig, authorConfig }
