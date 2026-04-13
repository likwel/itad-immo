import { useState } from 'react'
import { useNavigate } from "react-router-dom";
import {
  usePosts, createPost, reactToPost, bookmarkPost, sharePost,
  useComments, useMembers, useCommunityStats, toggleFollow,
} from '../hooks/useCommunity'
import Spinner from '../components/ui/Spinner'

const Icon = ({ d, size = 20, className = '', strokeWidth = 1.8, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke="currentColor" strokeWidth={strokeWidth}
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p}/>) : <path d={d}/>}
  </svg>
)

const Icons = {
  heart:     'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
  comment:   'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  share:     ['M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8','M16 6l-4-4-4 4','M12 2v13'],
  bookmark:  'M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z',
  star:      'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  trending:  ['M23 6l-9.5 9.5-5-5L1 18','M17 6h6v6'],
  users:     ['M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2','M9 11a4 4 0 100-8 4 4 0 000 8z','M23 21v-2a4 4 0 00-3-3.87','M16 3.13a4 4 0 010 7.75'],
  home:      'M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z M9 21V12h6v9',
  plus:      'M12 5v14M5 12h14',
  search:    'M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z',
  send:      'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  close:     'M18 6L6 18M6 6l12 12',
  more:      'M12 5h.01M12 12h.01M12 19h.01',
  verified:  ['M22 11.08V12a10 10 0 11-5.93-9.14','M22 4L12 14.01l-3-3'],
  building:  ['M3 21h18','M5 21V7l7-4 7 4v14','M9 21v-4h6v4'],
  briefcase: ['M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z','M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2'],
  award:     ['M12 15a7 7 0 100-14 7 7 0 000 14z','M8.21 13.89L7 23l5-3 5 3-1.21-9.12'],
  hash:      'M4 9h16M4 15h16M10 3L8 21M16 3l-2 18',
  fire:      'M12 2c0 0-5 4-5 9a5 5 0 0010 0c0-5-5-9-5-9z',
  smile:     ['M12 22a10 10 0 100-20 10 10 0 000 20z','M8 14s1.5 2 4 2 4-2 4-2','M9 9h.01M15 9h.01'],
  mapPin:    ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z','M12 10a1 1 0 100-2 1 1 0 000 2z'],
  bell:      ['M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9','M13.73 21a2 2 0 01-3.46 0'],
}

const ROLES = {
  CLIENT:   { label:'Client',      color:'bg-blue-50 text-blue-600 border-blue-100'        },
  SELLER:   { label:'Vendeur',     color:'bg-emerald-50 text-emerald-600 border-emerald-100'},
  AGENCY:   { label:'Agence',      color:'bg-violet-50 text-violet-600 border-violet-100'  },
  SUPPLIER: { label:'Fournisseur', color:'bg-amber-50 text-amber-600 border-amber-100'     },
  NOTARY:   { label:'Notaire',     color:'bg-rose-50 text-rose-600 border-rose-100'        },
  ADMIN:    { label:'Admin',       color:'bg-slate-100 text-slate-600 border-slate-200'    },
}

const TABS       = [
  { key:'feed',     label:'Fil',       icon:Icons.home     },
  { key:'trending', label:'Tendances', icon:Icons.trending },
  { key:'network',  label:'Réseau',    icon:Icons.users    },
]
const CATEGORIES = [
  { key:'all',         label:'Tout',        icon:Icons.hash      },
  { key:'experience',  label:'Expériences', icon:Icons.smile     },
  { key:'advice',      label:'Conseils',    icon:Icons.award     },
  { key:'review',      label:'Avis biens',  icon:Icons.star      },
  { key:'partnership', label:'Partenariat', icon:Icons.briefcase },
  { key:'news',        label:'Actualités',  icon:Icons.bell      },
]

const AVATAR_COLORS = ['bg-blue-600','bg-violet-600','bg-emerald-600','bg-amber-500','bg-rose-500','bg-teal-600']
const colorFor = name => AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length]


const Avatar = ({ user, size = 10 }) => {
  const navigate = useNavigate();

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`;

  const handleClick = () => {
    if (user?.id) {
      const url = user.role === 'SELLER' || user.role === 'AGENCY' ? `/agences/vendeur/${user.id}` : `/agences/${user.id}`
      navigate(url);
    }
  };

  if (user?.avatar) return (
    <img
      src={user.avatar}
      alt={initials}
      onClick={handleClick}
      className={`w-${size} h-${size} rounded-xl object-cover flex-shrink-0 cursor-pointer`}
    />
  );

  return (
    <div
      onClick={handleClick}
      className={`w-${size} h-${size} rounded-xl ${colorFor(user?.firstName)} flex items-center justify-center text-white font-bold text-xs flex-shrink-0 cursor-pointer`}
    >
      {initials}
    </div>
  );
};

const RoleBadge = ({ role }) => {
  const r = ROLES[role] || ROLES.CLIENT
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${r.color}`}>{r.label}</span>
}

const StarRow = ({ rating, size = 12 }) => (
  <div className="flex items-center gap-0.5">
    {[1,2,3,4,5].map(i => (
      <Icon key={i} d={Icons.star} size={size} strokeWidth={1.5}
        className={i <= rating ? 'text-amber-400' : 'text-slate-200'}
        fill={i <= rating ? 'currentColor' : 'none'}/>
    ))}
  </div>
)

// ── Composant commentaires ────────────────────────────────────
function CommentsSection({ postId }) {
  const { comments, loading, addComment } = useComments(postId)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  const submit = async () => {
    if (!input.trim()) return
    setSending(true)
    try { await addComment(input.trim()); setInput('') }
    finally { setSending(false) }
  }

  return (
    <div className="px-5 pb-4 bg-slate-50 border-t border-slate-100">
      {loading ? (
        <div className="py-4 flex justify-center"><Spinner/></div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-slate-400 py-3 text-center">Aucun commentaire. Soyez le premier !</p>
      ) : (
        <div className="flex flex-col gap-3 py-3 max-h-64 overflow-y-auto">
          {comments.map(c => (
            <div key={c.id}>
              <div className="flex gap-2">
                <Avatar user={c.author} size={7}/>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">{c.author.firstName} {c.author.lastName}</span>
                    <RoleBadge role={c.author.role}/>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{c.content}</p>
                </div>
              </div>
              {c.replies?.map(r => (
                <div key={r.id} className="flex gap-2 ml-9 mt-2">
                  <Avatar user={r.author} size={6}/>
                  <div>
                    <span className="text-xs font-bold text-slate-700">{r.author.firstName} {r.author.lastName}</span>
                    <p className="text-xs text-slate-600 mt-0.5">{r.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2 mt-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Écrire un commentaire..."
          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none text-xs text-slate-700 transition"/>
        <button onClick={submit} disabled={!input.trim() || sending}
          className="w-8 h-8 rounded-xl bg-blue-600 disabled:opacity-40 flex items-center justify-center flex-shrink-0">
          <Icon d={Icons.send} size={12} className="text-white"/>
        </button>
      </div>
    </div>
  )
}

// ── Composant post ────────────────────────────────────────────
function PostCard({ post, onLike, onBookmark, onShare }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-start gap-3 px-5 pt-5 pb-3">
        <Avatar user={post.author}/>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-slate-800">{post.author.firstName} {post.author.lastName}</span>
            {post.author.isVerified && <Icon d={Icons.verified} size={14} className="text-blue-500"/>}
            <RoleBadge role={post.author.role}/>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {post.property && (
              <><Icon d={Icons.home} size={10} className="text-slate-400"/>
              <span className="text-xs text-slate-400">{post.property.title}</span>
              <span className="text-slate-300">·</span></>
            )}
            <span className="text-xs text-slate-400">
              {new Date(post.createdAt).toLocaleDateString('fr-FR', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 pb-3">
        {post.rating && <div className="mb-2"><StarRow rating={post.rating}/></div>}
        <p className="text-sm text-slate-700 leading-relaxed">{post.content}</p>
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {post.tags.map(tag => (
              <span key={tag} className="text-xs text-blue-600 font-medium hover:underline cursor-pointer">{tag}</span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 px-4 py-3 border-t border-slate-100">
        <button onClick={() => onLike(post.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            post.liked ? 'bg-rose-50 text-rose-500' : 'text-slate-500 hover:bg-slate-100'
          }`}>
          <Icon d={Icons.heart} size={14} fill={post.liked ? 'currentColor' : 'none'}/>
          {post._count?.reactions ?? 0}
        </button>
        <button onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition">
          <Icon d={Icons.comment} size={14}/>
          {post._count?.comments ?? 0}
        </button>
        <button onClick={() => onShare(post.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition">
          <Icon d={Icons.share} size={14}/>
          Partager
        </button>
        <button onClick={() => onBookmark(post.id)}
          className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            post.bookmarked ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-100'
          }`}>
          <Icon d={Icons.bookmark} size={14} fill={post.bookmarked ? 'currentColor' : 'none'}/>
        </button>
      </div>

      {expanded && <CommentsSection postId={post.id}/>}
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────
export default function Community() {
  const [tab,      setTab]      = useState('feed')
  const [category, setCategory] = useState('all')
  const [search,   setSearch]   = useState('')
  const [composing,setComposing]= useState(false)
  const [newPost,  setNewPost]  = useState('')
  const [newRating,setNewRating]= useState(0)
  const [hoverStar,setHoverStar]= useState(0)
  const [submitting, setSubmitting] = useState(false)

  const sort = tab === 'trending' ? 'popular' : 'recent'
  const { data: posts, loading, error, refetch } = usePosts({ category, search, sort })
  const { members } = useMembers()
  const { stats } = useCommunityStats()

  const [localPosts, setLocalPosts] = useState(null)
  const displayPosts = localPosts ?? posts

  // Sync localPosts avec posts quand on refetch
  const syncedPosts = localPosts
    ? posts.map(p => localPosts.find(lp => lp.id === p.id) ?? p)
    : posts

  const handleLike = async (postId) => {
    setLocalPosts(prev => (prev ?? posts).map(p =>
      p.id === postId ? { ...p, liked:!p.liked, _count:{ ...p._count, reactions: p.liked ? p._count.reactions-1 : p._count.reactions+1 }} : p
    ))
    try { await reactToPost(postId) }
    catch { refetch() }
  }

  const handleBookmark = async (postId) => {
    setLocalPosts(prev => (prev ?? posts).map(p =>
      p.id === postId ? { ...p, bookmarked:!p.bookmarked } : p
    ))
    try { await bookmarkPost(postId) }
    catch { refetch() }
  }

  const handleShare = async (postId) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/community/posts/${postId}`)
      await sharePost(postId, 'copy')
    } catch {}
  }

  const [localMembers, setLocalMembers] = useState(null)
  const handleFollow = async (userId) => {
    setLocalMembers(prev => (prev ?? members).map(m =>
      m.id === userId ? { ...m, following:!m.following } : m
    ))
    try { await toggleFollow(userId) }
    catch { setLocalMembers(null) }
  }
  const displayMembers = localMembers ?? members

  const submitPost = async () => {
    if (!newPost.trim()) return
    setSubmitting(true)
    try {
      await createPost({ content: newPost.trim(), rating: newRating || null, category: category !== 'all' ? category : 'EXPERIENCE' })
      setNewPost(''); setNewRating(0); setComposing(false)
      refetch()
    } finally { setSubmitting(false) }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
              <Icon d={Icons.users} size={22} className="text-blue-600"/>
              Communauté
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">Échangez, partagez, connectez-vous</p>
          </div>
          <button onClick={() => setComposing(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm shadow-blue-200 active:scale-95">
            <Icon d={Icons.plus} size={15}/>
            Nouvelle publication
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-2xl p-1 mb-5 shadow-sm overflow-x-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all flex-shrink-0 ${
                tab === t.key ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}>
              <Icon d={t.icon} size={14}/>
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
          <div className="flex flex-col gap-4 min-w-0">

            {/* Composer */}
            {composing && (
              <div className="bg-white rounded-2xl border border-blue-200 shadow-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-700">Nouvelle publication</h3>
                  <button onClick={() => setComposing(false)} className="text-slate-400 hover:text-slate-600">
                    <Icon d={Icons.close} size={16}/>
                  </button>
                </div>
                <textarea value={newPost} onChange={e => setNewPost(e.target.value)} rows={4}
                  placeholder="Partagez votre expérience, un conseil, une actualité..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none text-sm text-slate-700 resize-none transition"/>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">Note :</span>
                    {[1,2,3,4,5].map(i => (
                      <button key={i} onMouseEnter={() => setHoverStar(i)} onMouseLeave={() => setHoverStar(0)}
                        onClick={() => setNewRating(i === newRating ? 0 : i)}>
                        <Icon d={Icons.star} size={18} strokeWidth={1.5}
                          className={i <= (hoverStar || newRating) ? 'text-amber-400' : 'text-slate-300'}
                          fill={i <= (hoverStar || newRating) ? 'currentColor' : 'none'}/>
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setComposing(false)}
                      className="px-4 py-1.5 rounded-xl border border-slate-200 text-slate-500 text-xs font-semibold hover:bg-slate-50 transition">
                      Annuler
                    </button>
                    <button onClick={submitPost} disabled={!newPost.trim() || submitting}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold transition">
                      {submitting ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Icon d={Icons.send} size={12}/>}
                      Publier
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Feed / Trending */}
            {(tab === 'feed' || tab === 'trending') && (
              <>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Icon d={Icons.search} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                    <input value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="Rechercher dans la communauté..."
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white focus:outline-none text-sm text-slate-700 transition"/>
                  </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth:'none' }}>
                  {CATEGORIES.map(c => (
                    <button key={c.key} onClick={() => setCategory(c.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex-shrink-0 ${
                        category === c.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-200'
                      }`}>
                      <Icon d={c.icon} size={12}/>
                      {c.label}
                    </button>
                  ))}
                </div>

                {loading ? (
                  <div className="flex justify-center py-16"><Spinner/></div>
                ) : error ? (
                  <div className="flex flex-col items-center py-16 gap-2 bg-white rounded-2xl border border-slate-200">
                    <Icon d={Icons.users} size={36} className="text-slate-300" strokeWidth={1.2}/>
                    <p className="text-slate-400 text-sm">{error}</p>
                  </div>
                ) : syncedPosts.length === 0 ? (
                  <div className="flex flex-col items-center py-16 gap-2 bg-white rounded-2xl border border-slate-200">
                    <Icon d={Icons.users} size={36} className="text-slate-300" strokeWidth={1.2}/>
                    <p className="text-slate-400 text-sm">Aucune publication trouvée</p>
                  </div>
                ) : syncedPosts.map(post => (
                  <PostCard key={post.id} post={post}
                    onLike={handleLike} onBookmark={handleBookmark} onShare={handleShare}/>
                ))}
              </>
            )}

            {/* Réseau */}
            {tab === 'network' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-sm font-bold text-slate-700 mb-4">Membres</h3>
                <div className="flex flex-col divide-y divide-slate-100">
                  {displayMembers.map(m => (
                    <div key={m.id} className="flex items-center gap-3 py-3">
                      <Avatar user={m} size={10}/>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-800 truncate">{m.firstName} {m.lastName}</span>
                          {m.isVerified && <Icon d={Icons.verified} size={13} className="text-blue-500"/>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <RoleBadge role={m.role}/>
                          <span className="text-xs text-slate-400">{m._count?.followers ?? 0} abonnés</span>
                        </div>
                      </div>
                      <button onClick={() => handleFollow(m.id)}
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                          m.following ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200'
                        }`}>
                        {m.following ? 'Suivi ✓' : 'Suivre'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4">

            {/* Stats */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Communauté</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: stats?.members?.toLocaleString('fr') ?? '—',  label:'Membres',      color:'text-blue-600'    },
                  { value: stats?.posts?.toLocaleString('fr') ?? '—',    label:'Publications',  color:'text-violet-600'  },
                  { value: stats?.roles?.AGENCY ?? '—',                  label:'Agences',       color:'text-emerald-600' },
                  { value: stats?.avgRating ? `${stats.avgRating}/5` : '—', label:'Note moy.', color:'text-amber-500'   },
                ].map(s => (
                  <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                    <div className={`text-lg font-extrabold ${s.color}`}>{s.value}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rôles */}
            {stats?.roles && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Qui participe ?</h3>
                <div className="flex flex-col gap-2">
                  {Object.entries(ROLES).filter(([k]) => stats.roles[k]).map(([key, r]) => {
                    const count = stats.roles[key] ?? 0
                    const total = Object.values(stats.roles).reduce((a,b) => a+b, 0)
                    const pct   = total ? Math.round((count/total)*100) : 0
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border w-24 text-center flex-shrink-0 ${r.color}`}>{r.label}</span>
                        <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-400 rounded-full transition-all" style={{ width:`${pct}%` }}/>
                        </div>
                        <span className="text-xs text-slate-400 w-6 text-right">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                <Icon d={Icons.users} size={18} className="text-white"/>
              </div>
              <h3 className="text-sm font-bold mb-1">Rejoignez la communauté</h3>
              <p className="text-xs text-blue-200 leading-relaxed mb-4">Partagez vos expériences et connectez-vous avec des professionnels.</p>
              <button className="w-full bg-white text-blue-600 text-xs font-bold py-2 rounded-xl hover:bg-blue-50 transition">
                Créer un compte
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}