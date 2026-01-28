# FreeBike Backend API

Backend Node.js/TypeScript pour l'application FreeBike - Service de location de vélos électriques.

## 🏗️ Architecture

Le backend utilise une **architecture en couches** avec abstraction de base de données :

```
src/
├── config/          # Configuration (DB, Swagger, etc.)
├── controllers/     # Contrôleurs (logique HTTP)
├── services/        # Services métier
├── repositories/    # Couche d'accès aux données (Pattern Repository)
├── middleware/      # Middlewares (auth, i18n, rate limiting, etc.)
├── routes/          # Définition des routes
├── models/          # Types et modèles TypeScript
├── locales/         # Fichiers de traduction (fr/en)
└── server.ts        # Point d'entrée
```

## 🗄️ Support Multi-Database

Le backend supporte **3 bases de données** sans modification de code grâce au pattern Repository :

- **MySQL** (recommandé pour production)
- **PostgreSQL**
- **SQLite** (pour développement/tests)

### Configuration de la base de données

Modifier le fichier `.env` :

```env
# Type de base de données (mysql, postgresql, sqlite)
DATABASE_TYPE=mysql

# MySQL
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=freebike
DATABASE_USER=root
DATABASE_PASSWORD=

# PostgreSQL (si DATABASE_TYPE=postgresql)
# DATABASE_HOST=localhost
# DATABASE_PORT=5432
# DATABASE_NAME=freebike
# DATABASE_USER=postgres
# DATABASE_PASSWORD=

# SQLite (si DATABASE_TYPE=sqlite)
# DATABASE_PATH=./data/freebike.db
```

## 🚀 Installation et Démarrage

### Prérequis

- Node.js 18+ 
- npm ou yarn
- Base de données (MySQL, PostgreSQL ou SQLite)

### Installation

```bash
cd backend
npm install
```

### Configuration

1. Copier le fichier `.env.example` en `.env`
2. Configurer les variables d'environnement :

```env
# Serveur
PORT=3000
NODE_ENV=development

# Base de données
DATABASE_TYPE=mysql
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=freebike
DATABASE_USER=root
DATABASE_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=FreeBike <noreply@freebike.cm>

# My-CoolPay API
COOLPAY_API_URL=https://api.my-coolpay.com
COOLPAY_API_KEY=your-coolpay-api-key
COOLPAY_MERCHANT_ID=your-merchant-id

# Frais de transfert
COOLPAY_FEE_PERCENTAGE=1.5
ORANGE_FEE_FIXED=100

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Langue par défaut
DEFAULT_LANGUAGE=fr
```

### Migrations de base de données

```bash
# Générer les migrations Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate dev

# (Optionnel) Seed avec données de test
npx prisma db seed
```

### Démarrage

```bash
# Mode développement (avec hot reload)
npm run dev

# Mode production
npm run build
npm start
```

Le serveur démarre sur `http://localhost:3000`

## 📚 Documentation API (Swagger)

Une fois le serveur démarré, accéder à la documentation Swagger :

```
http://localhost:3000/api-docs
```

Swagger UI permet de :
- ✅ Visualiser toutes les routes
- ✅ Tester les endpoints directement
- ✅ Voir les schémas de requêtes/réponses
- ✅ Gérer l'authentification JWT

## 🔐 Authentification

Le backend utilise **JWT (JSON Web Tokens)** pour l'authentification.

### Workflow d'authentification

1. **Inscription** : `POST /api/auth/register`
2. **Connexion** : `POST /api/auth/login` → Retourne un token JWT
3. **Utilisation** : Ajouter le header `Authorization: Bearer {token}` à chaque requête

### Exemple de requête authentifiée

```javascript
fetch('http://localhost:3000/api/users/me', {
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    'Accept-Language': 'fr'
  }
})
```

## 🌍 Internationalisation (i18n)

Le backend supporte **français** et **anglais**.

### Utilisation

Ajouter le header `Accept-Language` dans les requêtes :

```
Accept-Language: fr    # Pour le français
Accept-Language: en    # Pour l'anglais
```

Les messages d'erreur, emails et notifications seront automatiquement traduits.

### Fichiers de traduction

- `src/locales/fr.json` - Traductions françaises
- `src/locales/en.json` - Traductions anglaises

## 💳 Intégration My-CoolPay

Le backend intègre l'API **My-CoolPay** pour les paiements mobiles.

### Frais appliqués

Lors d'une recharge de compte :
- **Frais CoolPay** : 1.5% du montant (configurable)
- **Frais Orange Money** : 100 FCFA fixe (configurable)

### Exemple de calcul

```
Montant souhaité : 5000 FCFA
Frais CoolPay (1.5%) : 75 FCFA
Frais Orange : 100 FCFA
Total à payer : 5175 FCFA
```

## 📧 Système d'Emails

Le backend envoie des emails automatiques pour :

### Emails utilisateurs
- ✉️ Confirmation d'inscription
- ✉️ Réinitialisation de mot de passe
- ✉️ Confirmation de réservation de vélo
- ✉️ Factures de trajet
- ✉️ Notifications importantes

### Emails administrateurs
- 📨 Envoi d'emails en masse
- 📨 Newsletters
- 📨 Notifications système

### Configuration SMTP

Utiliser Gmail, SendGrid, Mailgun ou tout autre service SMTP :

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password  # Utiliser un mot de passe d'application
```

## 🔔 Système de Notifications

Le backend gère les notifications en temps réel :

- 🔔 Notifications push
- 📱 Notifications in-app
- 📧 Notifications par email

Types de notifications :
- Nouveau trajet disponible
- Trajet terminé
- Solde faible
- Maintenance programmée
- Messages du support
- Promotions

## 🛡️ Sécurité

### Rate Limiting

Protection contre les attaques par force brute :
- **100 requêtes par 15 minutes** par IP (configurable)
- Endpoints sensibles (login, register) ont des limites plus strictes

### Autres mesures de sécurité

- ✅ Hachage bcrypt pour les mots de passe
- ✅ Validation des entrées avec Joi
- ✅ Protection CORS
- ✅ Headers de sécurité (Helmet)
- ✅ Sanitization des données
- ✅ Gestion des erreurs sécurisée

## 📊 Système d'Audit

Toutes les actions importantes sont enregistrées :

```typescript
{
  action: 'user.login',
  userId: '123',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  metadata: { ... },
  timestamp: '2025-10-11T...'
}
```

Actions auditées :
- Connexions/déconnexions
- Modifications de données sensibles
- Transactions financières
- Actions administratives

## 🏥 Health Check

Vérifier l'état du serveur et de la base de données :

```bash
GET /api/admin/health
```

Réponse :
```json
{
  "status": "healthy",
  "timestamp": "2025-10-11T...",
  "uptime": 123456,
  "database": "connected",
  "services": {
    "email": "operational",
    "payment": "operational"
  }
}
```

## 📈 Fonctionnalités Avancées

### 1. Codes Promo / Vouchers

```typescript
// Créer un code promo
POST /api/admin/promo-codes
{
  "code": "WELCOME10",
  "type": "percentage",
  "value": 10,
  "maxUses": 100,
  "expiresAt": "2025-12-31"
}

// Utiliser un code promo
POST /api/rides/apply-promo
{
  "code": "WELCOME10"
}
```

### 2. Système d'Évaluation

```typescript
// Noter un trajet
POST /api/rides/{rideId}/review
{
  "rating": 5,
  "comment": "Excellent vélo, très confortable!"
}
```

### 3. Remboursements

```typescript
// Demander un remboursement
POST /api/refunds
{
  "rideId": "123",
  "reason": "Vélo défectueux",
  "amount": 500
}
```

### 4. Géofencing

```typescript
// Définir une zone autorisée
POST /api/admin/geofences
{
  "name": "Zone Centre-ville Douala",
  "type": "service_area",
  "coordinates": [[lat, lng], ...]
}
```

### 5. Support / Tickets

```typescript
// Créer un ticket
POST /api/support/tickets
{
  "subject": "Problème de paiement",
  "message": "...",
  "priority": "high"
}
```

## 🧪 Tests

```bash
# Tests unitaires
npm test

# Tests d'intégration
npm run test:integration

# Coverage
npm run test:coverage
```

## 🚀 Déploiement

### Production

1. Build de l'application :
```bash
npm run build
```

2. Configurer les variables d'environnement production

3. Démarrer :
```bash
NODE_ENV=production npm start
```

### Docker (optionnel)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📦 Scripts npm

```json
{
  "dev": "Démarrage en mode développement",
  "build": "Compilation TypeScript",
  "start": "Démarrage en production",
  "test": "Exécution des tests",
  "migrate": "Migration de la base de données",
  "seed": "Remplissage de données de test"
}
```

## 🤝 Support

Pour toute question ou problème :
- 📧 Email : support@freebike.cm
- 📱 WhatsApp : +237 6XX XX XX XX
- 🌐 Documentation complète : https://docs.freebike.cm

## 📝 Licence

Copyright © 2025 FreeBike Cameroun. Tous droits réservés.
