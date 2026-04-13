import { Link } from 'react-router-dom'
export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <Link to="/" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none', flexShrink:0 }}>
            <img src="/itadplus.png" alt="itadplus logo" style={{ height: 36, width: 'auto', objectFit: 'contain', display: 'block', border : '1px solid #3083f8', borderRadius : '10px' }} />
          </Link>
          <p className="text-sm leading-relaxed">La plateforme immobilière de référence à Madagascar. Vente, location, vacances.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Explorer</h4>
          <div className="flex flex-col gap-2 text-sm">
            <Link to="/annonces?listingType=SALE" className="hover:text-white transition-colors">Biens à vendre</Link>
            <Link to="/annonces?listingType=RENT" className="hover:text-white transition-colors">Locations</Link>
            <Link to="/annonces?listingType=VACATION_RENT" className="hover:text-white transition-colors">Vacances</Link>
          </div>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Mon compte</h4>
          <div className="flex flex-col gap-2 text-sm">
            <Link to="/register" className="hover:text-white transition-colors">S'inscrire</Link>
            <Link to="/login"    className="hover:text-white transition-colors">Se connecter</Link>
            <Link to="/espace-vendeur" className="hover:text-white transition-colors">Déposer une annonce</Link>
          </div>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Contact</h4>
          <div className="text-sm flex flex-col gap-2">
            <span className="flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 flex-shrink-0">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
              contact@itad-plus.mg
            </span>

            <span className="flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 flex-shrink-0">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92v2z"/>
              </svg>
              +261 34 00 000 00
            </span>

            <span className="flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 flex-shrink-0">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              Antananarivo, Madagascar
            </span>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 mt-8 pt-6 border-t border-slate-800 text-sm text-center">
        © {new Date().getFullYear()} itad-plus. Tous droits réservés.
      </div>
    </footer>
  )
}
