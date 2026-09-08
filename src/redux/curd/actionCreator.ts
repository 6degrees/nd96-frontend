/*
|--------------------------------------------------------------------------
| Generic CRUD Action Creator
|--------------------------------------------------------------------------
*/


import {toast} from "@/lib/toast/toast";

/*
|--------------------------------------------------------------------------
| createCrudActions
|--------------------------------------------------------------------------
*/
export const createCrudActions = (actions: any, service: any) => {

    const {
        getItemsBegin,
        getItemsSuccess,
        getItemsErr,

        getSingleItemBegin,
        getSingleItemSuccess,
        getSingleItemErr,

        createItemBegin,
        createItemSuccess,
        createItemErr,

        updateItemBegin,
        updateItemSuccess,
        updateItemErr,

        deleteItemBegin,
        deleteItemSuccess,
        deleteItemErr,

        statusChangeBegin,
        statusChangeSuccess,
        statusChangeErr,
    } = actions

    return {

        /*
        |--------------------------------------------------------------------------
        | Fetch Items
        |--------------------------------------------------------------------------
        */
        fetch: (params?: any) => {
            return async (dispatch: any) => {
                dispatch(getItemsBegin())
                try {
                    const data = await service.getItems(params)
                    dispatch(getItemsSuccess(data))
                    return data;
                } catch (err: any) {
                    dispatch(getItemsErr(err.response?.data))
                }
            }
        },

        /*
        |--------------------------------------------------------------------------
        | Get Single Item
        |--------------------------------------------------------------------------
        */
        detail: (id: string) => {
            return async (dispatch: any) => {
                dispatch(getSingleItemBegin())
                try {
                    const data = await service.getItemById(id)
                    dispatch(getSingleItemSuccess(data))
                   return data;
                } catch (err: any) {
                    dispatch(getSingleItemErr(err.response?.data))
                }
            }
        },

        /*
        |--------------------------------------------------------------------------
        | Create Item
        |--------------------------------------------------------------------------
        */
        create: (payload: any, callback?: any) => {
            return async (dispatch: any) => {
                dispatch(createItemBegin())
                try {
                    const data = await service.createItem(payload)
                    if (callback) callback()
                    dispatch(createItemSuccess(data))
                } catch (err: any) {
                    dispatch(createItemErr(err.response?.data))
                }
            }
        },

        /*
        |--------------------------------------------------------------------------
        | Update Item
        |--------------------------------------------------------------------------
        */
        update: (id: string, payload: any, callback?: any) => {
            return async (dispatch: any) => {
                dispatch(updateItemBegin())
                try {
                    const data = await service.partialUpdateItem(id, payload)
                    if (callback) callback()
                    dispatch(updateItemSuccess(data))
                } catch (err: any) {
                    dispatch(updateItemErr(err.response?.data))
                }
            }
        },

        /*
        |--------------------------------------------------------------------------
        | Delete Item
        |--------------------------------------------------------------------------
        */
        delete: (id: string, callback?: any) => {
            return async (dispatch: any) => {
                dispatch(deleteItemBegin())
                try {
                    await service.deleteItem(id)
                    if (callback) callback()
                    dispatch(deleteItemSuccess())
                } catch (err: any) {
                    toast.error({
                        message:
                            err?.response?.data?.detail ||
                            err?.response?.data?.message ||
                            'Something went wrong.',
                    })
                    dispatch(deleteItemErr(err.response?.data))
                }
            }
        },

        /*
        |--------------------------------------------------------------------------
        | Change Status
        |--------------------------------------------------------------------------
        */
        status: (id: string, status: 'active' | 'disable', callback?: any) => {
            return async (dispatch: any) => {
                dispatch(statusChangeBegin())
                try {
                    if (status === 'active') {
                        await service.activateItem(id)
                    } else {
                        await service.disableItem(id)
                    }

                    if (callback) callback()
                    dispatch(statusChangeSuccess())

                } catch (err: any) {
                    toast.error({
                        message:
                            err?.response?.data?.detail ||
                            err?.response?.data?.message ||
                            'Something went wrong.',
                    })
                    dispatch(statusChangeErr(err.response?.data))
                }
            }
        },
    }
}