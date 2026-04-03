import { api } from './api'

export const getProperties   = q      => api(`/properties?${q}`)
export const getProperty     = slug   => api(`/properties/${slug}`)
export const getMyProperties = ()     => api('/properties/my')
export const getCategories   = ()     => api('/categories')
export const toggleFav       = id    => api(`/properties/${id}/favorite`, { method: 'POST' })

export const createProperty = (data) =>
  api('/properties', {
    method: 'POST',
    body: JSON.stringify(data)
  })

export const updateProperty = (id, data) =>
  api(`/properties/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })

export const deleteProperty = id =>
  api(`/properties/${id}`, { method: 'DELETE' })