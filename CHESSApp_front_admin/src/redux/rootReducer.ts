import { combineReducers } from '@reduxjs/toolkit';
import { globalDataReducer } from './globalData';
import { adminDataReducer } from './adminData';
import { databaseConfigReducer } from './databaseConfig';

const rootReducer = combineReducers({
  globalData: globalDataReducer,
  adminData: adminDataReducer,
  databaseConfig: databaseConfigReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer; 