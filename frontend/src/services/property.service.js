import { api } from './api'
export const getProperties   = q      => api(`/properties?${q}`)
export const getProperty     = slug   => api(`/properties/${slug}`)
export const getMyProperties = ()     => api('/properties/my')
export const createProperty  = data   => {
  const fd = new FormData()
  Object.entries(data).forEach(([k,v]) => {
    if (Array.isArray(v) && k === 'files') v.forEach(f => fd.append('images', f))
    else if (Array.isArray(v)) fd.append(k, JSON.stringify(v))
    else if (v != null) fd.append(k, v)
  })
  return api('/properties', { method:'POST', body: fd })
}
export const updateProperty = (id, data) => api(`/properties/${id}`, { method:'PUT',    body: JSON.stringify(data) })
export const deleteProperty = id         => api(`/properties/${id}`, { method:'DELETE' })
export const toggleFav      = id         => api(`/properties/${id}/favorite`, { method:'POST' })
export const getCategories  = ()         => api('/categories')
