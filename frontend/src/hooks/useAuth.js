import { useSelector, useDispatch } from 'react-redux'
import { setCredentials, logout as logoutAction } from '../store/authSlice'
import { loginUser, registerUser } from '../services/auth.service'
export function useAuth() {
  const dispatch = useDispatch()
  const { user, token } = useSelector(s => s.auth)
  const login    = async (email, password) => { const d = await loginUser(email, password); dispatch(setCredentials(d)); return d }
  const register = async (payload)         => { const d = await registerUser(payload);      dispatch(setCredentials(d)); return d }
  const logout   = ()                      => dispatch(logoutAction())
  return { user, token, login, register, logout, isAuthenticated: !!user }
}
