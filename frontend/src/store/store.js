import { configureStore } from '@reduxjs/toolkit'
import authReducer     from './authSlice'
import propertyReducer from './propertySlice'
export const store = configureStore({ reducer: { auth: authReducer, properties: propertyReducer } })
