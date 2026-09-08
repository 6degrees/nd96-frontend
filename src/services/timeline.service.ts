import {createCrudService} from '@/services/createCrudService'

export const timelineService = {
    /*
    |--------------------------------------------------------------------------
    | CRUD
    |--------------------------------------------------------------------------
    */
    ...createCrudService<any, any>('/api/v1/timelines/'),
}