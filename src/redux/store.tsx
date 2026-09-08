import {configureStore} from "@reduxjs/toolkit";
import {createCrudReducer} from "@/redux/curd/createCrudReducer";
import {actions as DepartmentAction} from '@/redux/department'
import {actions as TimelineAction} from '@/redux/timeline'
import {actions as MessageAction} from '@/redux/message'

/*
|--------------------------------------------------------------------------
| Redux Store Configuration
|--------------------------------------------------------------------------
|
| Creates the application's global Redux store.
|
| Each reducer registered here becomes a top-level state slice.
|
| Example:
|
| {
|     auth: {
|         login: false,
|         user: {},
|         loading: false,
|         error: null,
|     }
| }
|
| Additional feature reducers should be registered here as the
| application grows.
|
*/
export const store = configureStore({
    reducer: {
        department: createCrudReducer(DepartmentAction) as any,
        timeline: createCrudReducer(TimelineAction) as any,
        message: createCrudReducer(MessageAction) as any,
    },
});

/*
|--------------------------------------------------------------------------
| RootState Type
|--------------------------------------------------------------------------
|
| Represents the complete shape of the Redux store state.
|
| Used with useSelector for full TypeScript support.
|
*/
export type RootState = ReturnType<typeof store.getState>;

/*
|--------------------------------------------------------------------------
| AppDispatch Type
|--------------------------------------------------------------------------
|
| Typed version of the Redux dispatch function.
|
| Used with useDispatch to provide proper typing for dispatched
| actions and async thunks throughout the application.
|
*/
export type AppDispatch = typeof store.dispatch;