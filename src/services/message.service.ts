import { createCrudService } from '@/services/createCrudService'

export const messageService = {
    /*
    |--------------------------------------------------------------------------
    | CRUD
    |--------------------------------------------------------------------------
    */
    ...createCrudService<any, any>('/api/v1/messages/'),
}