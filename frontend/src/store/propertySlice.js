import { createSlice } from '@reduxjs/toolkit'
const propertySlice = createSlice({
  name: 'properties',
  initialState: { filters: {}, list: [], total: 0 },
  reducers: {
    setFilters:   (s, { payload }) => { s.filters = { ...s.filters, ...payload } },
    clearFilters: s => { s.filters = {} }
  }
})
export const { setFilters, clearFilters } = propertySlice.actions
export default propertySlice.reducer
