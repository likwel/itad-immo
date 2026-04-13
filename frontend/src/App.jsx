import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useState } from 'react'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Home           from './pages/Home'
import Listings       from './pages/Listings'
import PropertyDetail from './pages/PropertyDetail'
import Login          from './pages/Login'
import Register       from './pages/Register'
import Booking        from './pages/Booking'
import Payment        from './pages/Payment'
import ClientDashboard  from './dashboards/ClientDashboard'
import SellerDashboard  from './dashboards/SellerDashboard'
import AdminDashboard   from './dashboards/AdminDashboard'
import NotFound         from './pages/NotFound'
import Favorites         from './pages/Favorites'
import Agencies         from './pages/Agencies'
import AgencyDetail         from './pages/AgencyDetail'
import Live         from './pages/Live'
import LiveList         from './pages/LiveList'

const PrivateRoute = ({ children, roles }) => {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

export default function App() {
  // État partagé navbar ↔ listings
  const [navbarProps, setNavbarProps] = useState({})

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/"               element={<Home />} />
            <Route path="/annonces"       element={<Listings />} />
            <Route path="/annonces/:slug" element={<PropertyDetail />} />
            <Route path="/agences" element={<Agencies />} />
            <Route path="/live"     element={<LiveList />} />
            <Route path="/live/:id" element={<Live />} />
            <Route path="/agences/vendeur/:id"  element={<AgencyDetail />} />
            <Route path="/agences/:id" element={<AgencyDetail />} />
            <Route path="/login"          element={<Login />} />
            <Route path="/register"       element={<Register />} />
            <Route path="/espace-client"  element={<PrivateRoute><ClientDashboard /></PrivateRoute>} />
            <Route path="/espace-vendeur" element={<PrivateRoute roles={['SELLER','AGENCY','ADMIN']}><SellerDashboard /></PrivateRoute>} />
            <Route path="/admin/*"        element={<PrivateRoute roles={['ADMIN']}><AdminDashboard /></PrivateRoute>} />
            <Route path="/reservation/:propertyId" element={<PrivateRoute><Booking /></PrivateRoute>} />
            <Route path="/paiement/:bookingId"     element={<PrivateRoute><Payment /></PrivateRoute>} />
            <Route path="/favoris" element={<PrivateRoute><Favorites /></PrivateRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
