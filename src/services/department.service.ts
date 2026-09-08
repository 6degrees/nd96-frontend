import { createCrudService } from '@/services/createCrudService'

export const departmentService = {
    /*
    |--------------------------------------------------------------------------
    | CRUD
    |--------------------------------------------------------------------------
    */
    ...createCrudService<any, any>('/api/v1/departments/'),
}