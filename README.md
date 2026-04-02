# 🏠 itad-immo — Plateforme Immobilière

Application web immobilière complète : React + Tailwind + Node.js + Express + PostgreSQL + Prisma

## Stack Technique

**Frontend:** React 18, Tailwind CSS, Redux Toolkit, React Router v6, Vite
**Backend:** Node.js, Express, Prisma ORM, JWT, Socket.io
**Base de données:** PostgreSQL
**Services:** Cloudinary (images), Stripe (paiements), Nodemailer (emails)

## Démarrage rapide

### Prérequis
- Node.js 18+
- PostgreSQL 14+

### 1. Backend
```bash
cd backend
npm install
# Configurer .env (DATABASE_URL, JWT_SECRET, etc.)
npx prisma db push
node prisma/seed.js
npm run dev
```

### 2. Frontend
```bash
cd frontend
npm install
# Configurer .env (VITE_API_URL)
npm run dev
```

## Comptes démo (après seed)

| Rôle    | Email                   | Mot de passe |
|---------|-------------------------|--------------|
| Admin   | admin@itad-immo.mg        | Admin1234!   |
| Vendeur | vendeur@itad-immo.mg      | Seller123!   |
| Client  | client@itad-immo.mg       | Client123!   |

## Fonctionnalités

- 🔍 Recherche géolocalisée (proximité, prix, type)
- 🏠 Catégories personnalisables (Location, Vente, Vacances...)
- 👤 4 rôles : Client, Vendeur, Agence, Admin
- 📅 Système de réservation + devis
- 💳 Paiement Stripe
- ⭐ Avis et notations
- 💬 Messagerie interne (Socket.io)
- 📊 Dashboard admin complet
- 🖼️ Upload photos Cloudinary

## Structure
```
itad-immo/
├── backend/   (Node.js + Express + Prisma)
└── frontend/  (React + Tailwind + Redux)
```
