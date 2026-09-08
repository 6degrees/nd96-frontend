import { httpClient } from '@/services/http'

/*
|--------------------------------------------------------------------------
| createCrudService
|--------------------------------------------------------------------------
*/
export const createCrudService = <Item, Filters = any>(endpoint: string) => ({
    /*
    |--------------------------------------------------------------------------
    | Get Items
    |--------------------------------------------------------------------------
    */
    async getItems(params?: Filters) {
        const res = await httpClient.get<Item[]>(endpoint, { params })
        return res.data
    },

    /*
    |--------------------------------------------------------------------------
    | Create Item
    |--------------------------------------------------------------------------
    */
    async createItem(data: any) {
        const res = await httpClient.post<Item>(endpoint, data)
        return res.data
    },

    /*
    |--------------------------------------------------------------------------
    | Get Item By Id
    |--------------------------------------------------------------------------
    */
    async getItemById(id: string) {
        const res = await httpClient.get<Item>(`${endpoint}${id}/`)
        return res.data
    },

    /*
    |--------------------------------------------------------------------------
    | Update Item
    |--------------------------------------------------------------------------
    */
    async updateItem(id: string, data: any) {
        const res = await httpClient.put<Item>(`${endpoint}${id}/`, data)
        return res.data
    },

    /*
    |--------------------------------------------------------------------------
    | Partial Update Item
    |--------------------------------------------------------------------------
    */
    async partialUpdateItem(id: string, data: Partial<Item>) {
        const res = await httpClient.patch<Item>(`${endpoint}${id}/`, data)
        return res.data
    },

    /*
    |--------------------------------------------------------------------------
    | Delete Item
    |--------------------------------------------------------------------------
    */
    async deleteItem(id: string) {
        const res = await httpClient.delete(`${endpoint}${id}/`)
        return res.data
    },

    /*
    |--------------------------------------------------------------------------
    | Activate Item
    |--------------------------------------------------------------------------
    */
    async activateItem(id: string) {
        const res = await httpClient.patch(`${endpoint}${id}/activate/`, {})
        return res.data
    },

    /*
    |--------------------------------------------------------------------------
    | Disable Item
    |--------------------------------------------------------------------------
    */
    async disableItem(id: string) {
        const res = await httpClient.patch(`${endpoint}${id}/deactivate/`, {})
        return res.data
    },
})