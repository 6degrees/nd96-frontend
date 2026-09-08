import {messageService} from '@/services/message.service'
import {createCrudActions} from '@/redux/curd/actionCreator'
import createActions from '@/redux/curd/actions'

/*
|--------------------------------------------------------------------------
| Message Actions
|--------------------------------------------------------------------------
|
| Defines Redux actions for managing message standards.
|
*/
export const actions = createActions('messages')

/*
|--------------------------------------------------------------------------
| Message API
|--------------------------------------------------------------------------
|
| Defines CRUD API actions for managing message standards.
|
*/
export const api = createCrudActions(actions, messageService)