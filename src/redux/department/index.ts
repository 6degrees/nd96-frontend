import {departmentService} from '@/services/department.service'
import {createCrudActions} from '@/redux/curd/actionCreator'
import createActions from '@/redux/curd/actions'

/*
|--------------------------------------------------------------------------
| Department Actions
|--------------------------------------------------------------------------
|
| Defines Redux actions for managing department standards.
|
*/
export const actions = createActions('departments')

/*
|--------------------------------------------------------------------------
| Department API
|--------------------------------------------------------------------------
|
| Defines CRUD API actions for managing department standards.
|
*/
export const api = createCrudActions(actions, departmentService)