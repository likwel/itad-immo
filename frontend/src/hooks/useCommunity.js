import { useState, useEffect, useCallback } from 'react'

const BASE     = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const getToken = () => localStorage.getItem('immo_token')

const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(getToken() && { Authorization: `Bearer ${getToken()}` }),
})

// ── Posts ─────────────────────────────────────────────────────
export function usePosts(filters = {}) {
  const [state, setState] = useState({ data:[], total:0, totalPages:1, loading:true, error:null })

  const fetch_ = useCallback(async () => {
    setState(s => ({ ...s, loading:true, error:null }))
    try {
      const params = new URLSearchParams(
        Object.entries(filters).filter(([,v]) => v != null && v !== '')
      ).toString()
      const res  = await fetch(`${BASE}/community/posts?${params}`, { headers: authHeaders() })
      if (!res.ok) throw new Error(`Erreur ${res.status}`)
      const data = await res.json()
      setState({ data: data.data, total: data.total, totalPages: data.totalPages, loading:false, error:null })
    } catch (e) {
      setState(s => ({ ...s, loading:false, error: e.message }))
    }
  }, [JSON.stringify(filters)])

  useEffect(() => { fetch_() }, [fetch_])
  return { ...state, refetch: fetch_ }
}

// ── Créer un post ─────────────────────────────────────────────
export async function createPost(payload) {
  const res = await fetch(`${BASE}/community/posts`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error((await res.json()).message)
  return res.json()
}

// ── Supprimer un post ─────────────────────────────────────────
export async function deletePost(id) {
  const res = await fetch(`${BASE}/community/posts/${id}`, {
    method: 'DELETE', headers: authHeaders(),
  })
  if (!res.ok) throw new Error((await res.json()).message)
  return res.json()
}

// ── Commentaires ──────────────────────────────────────────────
export function useComments(postId) {
  const [comments, setComments] = useState([])
  const [loading,  setLoading]  = useState(false)

  const load = useCallback(async () => {
    if (!postId) return
    setLoading(true)
    try {
      const res  = await fetch(`${BASE}/community/posts/${postId}/comments`, { headers: authHeaders() })
      const data = await res.json()
      setComments(data)
    } finally { setLoading(false) }
  }, [postId])

  useEffect(() => { load() }, [load])

  const addComment = async (content, parentId = null) => {
    const res = await fetch(`${BASE}/community/posts/${postId}/comments`, {
      method: 'POST', headers: authHeaders(), body: JSON.stringify({ content, parentId }),
    })
    if (!res.ok) throw new Error((await res.json()).message)
    const comment = await res.json()
    setComments(prev => parentId
      ? prev.map(c => c.id === parentId ? { ...c, replies: [...(c.replies||[]), comment] } : c)
      : [...prev, comment]
    )
    return comment
  }

  return { comments, loading, addComment, reload: load }
}

// ── Réaction ──────────────────────────────────────────────────
export async function reactToPost(postId, type = 'LIKE') {
  const res = await fetch(`${BASE}/community/posts/${postId}/react`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify({ type }),
  })
  if (!res.ok) throw new Error((await res.json()).message)
  return res.json()
}

// ── Bookmark ──────────────────────────────────────────────────
export async function bookmarkPost(postId) {
  const res = await fetch(`${BASE}/community/posts/${postId}/bookmark`, {
    method: 'POST', headers: authHeaders(),
  })
  if (!res.ok) throw new Error((await res.json()).message)
  return res.json()
}

// ── Share ─────────────────────────────────────────────────────
export async function sharePost(postId, platform = 'copy') {
  const res = await fetch(`${BASE}/community/posts/${postId}/share`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify({ platform }),
  })
  if (!res.ok) throw new Error((await res.json()).message)
  return res.json()
}

// ── Follow ────────────────────────────────────────────────────
export async function toggleFollow(userId) {
  const res = await fetch(`${BASE}/community/follow/${userId}`, {
    method: 'POST', headers: authHeaders(),
  })
  if (!res.ok) throw new Error((await res.json()).message)
  return res.json()
}

// ── Membres ───────────────────────────────────────────────────
export function useMembers(filters = {}) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams(
      Object.entries(filters).filter(([,v]) => v != null && v !== '')
    ).toString()
    setLoading(true)
    fetch(`${BASE}/community/members?${params}`, { headers: authHeaders() })
      .then(r => r.json()).then(setMembers).finally(() => setLoading(false))
  }, [JSON.stringify(filters)])

  return { members, loading }
}

// ── Stats communauté ──────────────────────────────────────────
export function useCommunityStats() {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${BASE}/community/stats`, { headers: authHeaders() })
      .then(r => r.json()).then(setStats).finally(() => setLoading(false))
  }, [])

  return { stats, loading }
}