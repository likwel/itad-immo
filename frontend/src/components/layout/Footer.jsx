import { Link } from 'react-router-dom'
export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-white font-bold text-lg mb-3">🏠 itad-immo</h3>
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
          <div className="text-sm flex flex-col gap-1">
            <span>📧 contact@itad-immo.mg</span>
            <span>📞 +261 34 00 000 00</span>
            <span>📍 Antananarivo, Madagascar</span>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 mt-8 pt-6 border-t border-slate-800 text-sm text-center">
        © {new Date().getFullYear()} itad-immo. Tous droits réservés.
      </div>
    </footer>
  )
}
