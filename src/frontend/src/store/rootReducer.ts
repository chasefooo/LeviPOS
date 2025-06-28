import {combineReducers, AnyAction, Reducer} from 'redux'
import base, {BaseState} from './slices/base'
import theme, { ThemeState } from './slices/theme/themeSlice'

export type RootState = {
  base: BaseState
  theme: ThemeState
  /* eslint-disable @typescript-eslint/no-explicit-any */
}

export interface AsyncReducers {
  [key: string]: Reducer<any, AnyAction>
}

const staticReducers = {
  base,
  theme,
}

const rootReducer =
  (asyncReducers?: AsyncReducers) => (state: RootState, action: AnyAction) => {
    const combinedReducer = combineReducers({
      ...staticReducers,
      ...asyncReducers,
    })
    return combinedReducer(state, action)
  }

export default rootReducer
