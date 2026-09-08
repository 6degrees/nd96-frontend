/*
|--------------------------------------------------------------------------
| Generic Reducer
|--------------------------------------------------------------------------
*/

const createReducer = (actions: any) => {

    const {
        GET_ITEMS_BEGIN,
        GET_ITEMS_SUCCESS,
        GET_ITEMS_ERR,

        GET_SINGLE_ITEM_BEGIN,
        GET_SINGLE_ITEM_SUCCESS,
        GET_SINGLE_ITEM_ERR,

        CREATE_ITEM_BEGIN,
        CREATE_ITEM_SUCCESS,
        CREATE_ITEM_ERR,

        UPDATE_ITEM_BEGIN,
        UPDATE_ITEM_SUCCESS,
        UPDATE_ITEM_ERR,

        DELETE_ITEM_BEGIN,
        DELETE_ITEM_SUCCESS,
        DELETE_ITEM_ERR,

        STATUS_CHANGE_BEGIN,
        STATUS_CHANGE_SUCCESS,
        STATUS_CHANGE_ERR,
    } = actions

    /*
    |--------------------------------------------------------------------------
    | Initial State
    |--------------------------------------------------------------------------
    */
    const initState = {
        list: [],
        current: null,
        loading: false,
        actionLoading: false,
        error: null,
    }

    /*
    |--------------------------------------------------------------------------
    | Reducer
    |--------------------------------------------------------------------------
    */
    return (
        state = initState,
        action: { type: any; data: any; err: any }
    ) => {

        const { type, data, err } = action

        switch (type) {

            /*
            |--------------------------------------------------------------------------
            | Read Flow (List and Single)
            |--------------------------------------------------------------------------
            */
            case GET_ITEMS_BEGIN:
            case GET_SINGLE_ITEM_BEGIN:
                return {
                    ...state,
                    loading: true,
                    error: null,
                }

            case GET_ITEMS_SUCCESS:
                return {
                    ...state,
                    list: data,
                    loading: false,
                    error: null,
                }

            case GET_SINGLE_ITEM_SUCCESS:
                return {
                    ...state,
                    current: data,
                    loading: false,
                    error: null,
                }

            /*
            |--------------------------------------------------------------------------
            | Create / Update / Status Flow
            |--------------------------------------------------------------------------
            */
            case CREATE_ITEM_BEGIN:
            case UPDATE_ITEM_BEGIN:
            case STATUS_CHANGE_BEGIN:
            case DELETE_ITEM_BEGIN:
                return {
                    ...state,
                    actionLoading: true,
                    error: null,
                }

            case CREATE_ITEM_SUCCESS:
                return {
                    ...state,
                    list: [data, ...(Array.isArray(state?.list) ? state.list : [])],
                    actionLoading: false,
                    error: null,
                }

            case UPDATE_ITEM_SUCCESS:
                return {
                    ...state,
                    list: state.list.map((item: any) =>
                        item.id === data.id ? data : item
                    ),
                    current: data,
                    actionLoading: false,
                    error: null,
                }

            /*
            |--------------------------------------------------------------------------
            | Delete Flow
            |--------------------------------------------------------------------------
            */
            case DELETE_ITEM_SUCCESS:
                return {
                    ...state,
                    actionLoading: false,
                    error: null,
                }

            /*
            |--------------------------------------------------------------------------
            | Status Change Flow
            |--------------------------------------------------------------------------
            */
            case STATUS_CHANGE_SUCCESS:
                return {
                    ...state,
                    actionLoading: false,
                    error: null,
                }

            /*
            |--------------------------------------------------------------------------
            | Error Handling
            |--------------------------------------------------------------------------
            */
            case GET_ITEMS_ERR:
            case GET_SINGLE_ITEM_ERR:
                return {
                    ...state,
                    loading: false,
                    error: err,
                }

            case CREATE_ITEM_ERR:
            case UPDATE_ITEM_ERR:
            case DELETE_ITEM_ERR:
            case STATUS_CHANGE_ERR:
                return {
                    ...state,
                    actionLoading: false,
                    error: err,
                }

            default:
                return state
        }
    }
}

export default createReducer