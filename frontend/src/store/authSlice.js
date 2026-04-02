import { createSlice } from '@reduxjs/toolkit'
const initialState = {
  user:  JSON.parse(localStorage.getItem('immo_user') || 'null'),
  token: localStorage.getItem('immo_token') || null
}
const authSlice = createSlice({
  name: 'auth', initialState,
  reducers: {
    setCredentials: (s, { payload: { user, token } }) => {
      s.user = user; s.token = token
      localStorage.setItem('immo_user', JSON.stringify(user))
      localStorage.setItem('immo_token', token)
    },
    logout: s => {
      s.user = null; s.token = null
      localStorage.removeItem('immo_user'); localStorage.removeItem('immo_token')
    }
  }
})
export const { setCredentials, logout } = authSlice.actions
export default authSlice.reducer
