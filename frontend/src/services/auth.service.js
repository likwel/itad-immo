import { api } from './api'
export const loginUser    = (email, password) => api('/auth/login',    { method:'POST', body: JSON.stringify({ email, password }) })
export const registerUser = payload           => api('/auth/register', { method:'POST', body: JSON.stringify(payload) })
export const getMe        = ()                => api('/auth/me')
export const updateMe     = data              => api('/auth/me',       { method:'PUT',  body: JSON.stringify(data) })
export const changePassword = data            => api('/auth/me/password', { method:'PUT', body: JSON.stringify(data) })
