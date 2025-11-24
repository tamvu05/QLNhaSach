import { initializeManager } from './adminManage.js'
const categoryConfig = {
    apiBaseUrl: '/api/category',
    modalAddId: 'add-category-modal',
    modalUpdateId: 'update-category-modal',
    entityName: 'thể loại',
    entityIdKey: 'MaTL',
    entityNameKey: 'TenTL',
    entityDescKey: 'MoTa',
}

initializeManager(categoryConfig)
