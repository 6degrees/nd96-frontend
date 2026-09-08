import {timelineService} from '@/services/timeline.service'
import {createCrudActions} from '@/redux/curd/actionCreator'
import createActions from '@/redux/curd/actions'

/*
|--------------------------------------------------------------------------
| Timeline Actions
|--------------------------------------------------------------------------
|
| Defines Redux actions for managing timline standards.
|
*/
export const actions = createActions('timelines')

/*
|--------------------------------------------------------------------------
| Timeline API
|--------------------------------------------------------------------------
|
| Defines CRUD API actions for managing timline standards.
|
*/
export const api = createCrudActions(actions, timelineService)