export default function Button({ children, variant = 'primary', loading, className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl px-6 py-2.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed'
  const variants = {
    primary:   'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md',
    secondary: 'bg-white border border-slate-200 hover:border-slate-300 text-slate-700',
    danger:    'bg-red-600 hover:bg-red-700 text-white',
    ghost:     'text-slate-600 hover:bg-slate-100',
  }
  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={loading} {...props}>
      {loading && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/></svg>}
      {children}
    </button>
  )
}
