import { initializeManager } from './adminManage.js'
const authorConfig = {
    apiBaseUrl: '/api/author',
    modalAddId: 'add-author-modal',
    modalUpdateId: 'update-author-modal',
    entityName: 'tác giả',
    entityIdKey: 'MaTG',
    entityNameKey: 'TenTG',
    entityDescKey: 'MoTa',
}

initializeManager(authorConfig)
