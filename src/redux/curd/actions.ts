/*
|--------------------------------------------------------------------------
| Generic Action Types
|--------------------------------------------------------------------------
*/

const createActions = (name: string) => {

    const prefix = `${name}/`

    const actions = {

        /*
        |--------------------------------------------------------------------------
        | Get Items
        |--------------------------------------------------------------------------
        */
        GET_ITEMS_BEGIN: `${prefix}GET_ITEMS_BEGIN`,
        GET_ITEMS_SUCCESS: `${prefix}GET_ITEMS_SUCCESS`,
        GET_ITEMS_ERR: `${prefix}GET_ITEMS_ERR`,

        /*
        |--------------------------------------------------------------------------
        | Get Single Item
        |--------------------------------------------------------------------------
        */
        GET_SINGLE_ITEM_BEGIN: `${prefix}GET_SINGLE_ITEM_BEGIN`,
        GET_SINGLE_ITEM_SUCCESS: `${prefix}GET_SINGLE_ITEM_SUCCESS`,
        GET_SINGLE_ITEM_ERR: `${prefix}GET_SINGLE_ITEM_ERR`,

        /*
        |--------------------------------------------------------------------------
        | Create Item
        |--------------------------------------------------------------------------
        */
        CREATE_ITEM_BEGIN: `${prefix}CREATE_ITEM_BEGIN`,
        CREATE_ITEM_SUCCESS: `${prefix}CREATE_ITEM_SUCCESS`,
        CREATE_ITEM_ERR: `${prefix}CREATE_ITEM_ERR`,

        /*
        |--------------------------------------------------------------------------
        | Update Item
        |--------------------------------------------------------------------------
        */
        UPDATE_ITEM_BEGIN: `${prefix}UPDATE_ITEM_BEGIN`,
        UPDATE_ITEM_SUCCESS: `${prefix}UPDATE_ITEM_SUCCESS`,
        UPDATE_ITEM_ERR: `${prefix}UPDATE_ITEM_ERR`,

        /*
        |--------------------------------------------------------------------------
        | Delete Item
        |--------------------------------------------------------------------------
        */
        DELETE_ITEM_BEGIN: `${prefix}DELETE_ITEM_BEGIN`,
        DELETE_ITEM_SUCCESS: `${prefix}DELETE_ITEM_SUCCESS`,
        DELETE_ITEM_ERR: `${prefix}DELETE_ITEM_ERR`,

        /*
        |--------------------------------------------------------------------------
        | Status Change
        |--------------------------------------------------------------------------
        */
        STATUS_CHANGE_BEGIN: `${prefix}STATUS_CHANGE_BEGIN`,
        STATUS_CHANGE_SUCCESS: `${prefix}STATUS_CHANGE_SUCCESS`,
        STATUS_CHANGE_ERR: `${prefix}STATUS_CHANGE_ERR`,

        /*
        |--------------------------------------------------------------------------
        | Action Creators
        |--------------------------------------------------------------------------
        */

        getItemsBegin: () => ({
            type: actions.GET_ITEMS_BEGIN,
        }),

        getItemsSuccess: (data: any) => ({
            type: actions.GET_ITEMS_SUCCESS,
            data,
        }),

        getItemsErr: (err: any) => ({
            type: actions.GET_ITEMS_ERR,
            err,
        }),

        getSingleItemBegin: () => ({
            type: actions.GET_SINGLE_ITEM_BEGIN,
        }),

        getSingleItemSuccess: (data: any) => ({
            type: actions.GET_SINGLE_ITEM_SUCCESS,
            data,
        }),

        getSingleItemErr: (err: any) => ({
            type: actions.GET_SINGLE_ITEM_ERR,
            err,
        }),

        createItemBegin: () => ({
            type: actions.CREATE_ITEM_BEGIN,
        }),

        createItemSuccess: (data: any) => ({
            type: actions.CREATE_ITEM_SUCCESS,
            data,
        }),

        createItemErr: (err: any) => ({
            type: actions.CREATE_ITEM_ERR,
            err,
        }),

        updateItemBegin: () => ({
            type: actions.UPDATE_ITEM_BEGIN,
        }),

        updateItemSuccess: (data: any) => ({
            type: actions.UPDATE_ITEM_SUCCESS,
            data,
        }),

        updateItemErr: (err: any) => ({
            type: actions.UPDATE_ITEM_ERR,
            err,
        }),

        deleteItemBegin: () => ({
            type: actions.DELETE_ITEM_BEGIN,
        }),

        deleteItemSuccess: () => ({
            type: actions.DELETE_ITEM_SUCCESS,
        }),

        deleteItemErr: (err: any) => ({
            type: actions.DELETE_ITEM_ERR,
            err,
        }),

        statusChangeBegin: () => ({
            type: actions.STATUS_CHANGE_BEGIN,
        }),

        statusChangeSuccess: () => ({
            type: actions.STATUS_CHANGE_SUCCESS,
        }),

        statusChangeErr: (err: any) => ({
            type: actions.STATUS_CHANGE_ERR,
            err,
        }),
    }

    return actions
}

export default createActions