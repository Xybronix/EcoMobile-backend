# FreeBike Backend API

Backend Node.js/TypeScript pour l'application FreeBike - Service de location de vélos électriques.

## 🏗️ Architecture

Le backend utilise une **architecture en couches** avec abstraction de base de données :

```
src/
├── config/          # Configuration (DB, Swagger, Prisma)
├── controllers/     # Contrôleurs HTTP (13 fichiers)
├── services/        # Services métier (32 fichiers)
├── repositories/    # Couche d'accès aux données (Pattern Repository)
├── middleware/      # Middlewares (auth, i18n, rate limiting, validation)
├── routes/          # Définition des routes (16 fichiers)
├── models/          # Types et modèles TypeScript
├── locales/         # Fichiers de traduction (fr.json, en.json)
├── types/           # Types Express personnalisés
├── utils/           # Utilitaires (scheduled jobs)
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
DB_TYPE=mysql

# MySQL
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=ecomobile_db
MYSQL_USER=root
MYSQL_PASSWORD=

# PostgreSQL (si DB_TYPE=postgresql)
# POSTGRES_HOST=localhost
# POSTGRES_PORT=5432
# POSTGRES_DATABASE=ecomobile_db
# POSTGRES_USER=postgres
# POSTGRES_PASSWORD=

# SQLite (si DB_TYPE=sqlite)
# SQLITE_PATH=./data/ecomobile.db
```

## 🚀 Installation et Démarrage

### Prérequis

- Node.js 20+
- npm ou yarn
- Base de données (MySQL, PostgreSQL ou SQLite)

### Installation

```bash
cd backend
npm install
```

### Configuration

1. Copier le fichier `.env.example` en `.env`
2. Configurer les variables d'environnement (voir [ENV_VARIABLES.md](ENV_VARIABLES.md))

Variables essentielles :

```env
# Serveur
PORT=10000
NODE_ENV=development

# Base de données
DB_TYPE=mysql
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=ecomobile_db
MYSQL_USER=root
MYSQL_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=FreeBike <noreply@freebike.cm>

# My-CoolPay API
COOLPAY_API_URL=https://api.my-coolpay.com
COOLPAY_API_KEY=your-coolpay-api-key
COOLPAY_MERCHANT_ID=your-merchant-id

# CORS
CORS_ORIGIN=http://localhost:3000,https://xybronix.github.io

# SMS (Twilio) - Optionnel
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### Migrations de base de données

```bash
# Générer Prisma Client
npx prisma generate

# Appliquer les migrations (développement)
npm run migrate
# ou
npx prisma migrate dev

# Appliquer les migrations (production)
npm run migrate:deploy
# ou
npx prisma migrate deploy

# Push du schéma (production, sans migrations)
npm run migrate:prod
# ou
npx prisma db push --accept-data-loss
```

### Seed de la base de données

Le seed est **production-safe** : il utilise `upsert()` pour créer uniquement les éléments manquants, sans supprimer les données existantes.

```bash
# Exécuter le seed
npm run db:seed
# ou
npx prisma db seed
```

**Données créées** :
- Rôles (SUPER_ADMIN, ADMIN, EMPLOYEE, etc.)
- Permissions
- Utilisateurs de test (admin, manager, user, support)
- Paramètres de l'entreprise
- Tarifs par défaut
- Portefeuilles

### Démarrage

```bash
# Mode développement (avec hot reload via nodemon)
npm run dev

# Mode production
npm run build
npm start
```

Le script `start` exécute automatiquement :
1. Build TypeScript (`npm run build`)
2. Migration de la base de données (`prisma db push`)
3. Seed intelligent (`npm run db:seed`)
4. Démarrage du serveur (`node dist/server.js`)

Le serveur démarre sur `http://localhost:10000`

## 📚 Documentation API (Swagger)

Une fois le serveur démarré, accéder à la documentation Swagger :

```
http://localhost:10000/api-docs
```

Swagger UI permet de :
- ✅ Visualiser toutes les routes
- ✅ Tester les endpoints directement
- ✅ Voir les schémas de requêtes/réponses
- ✅ Gérer l'authentification JWT

## 🔐 Authentification

Le backend utilise **JWT (JSON Web Tokens)** pour l'authentification.

### Workflow d'authentification

1. **Inscription** : `POST /api/v1/auth/register`
2. **Connexion** : `POST /api/v1/auth/login` → Retourne un token JWT
3. **Utilisation** : Ajouter le header `Authorization: Bearer {token}` à chaque requête
4. **Refresh** : `POST /api/v1/auth/refresh` pour renouveler le token

### Exemple de requête authentifiée

```javascript
fetch('http://localhost:10000/api/v1/users/me', {
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    'Accept-Language': 'fr'
  }
})
```

### Système de Rôles et Permissions

**Rôles disponibles** :
- `SUPER_ADMIN` : Accès total
- `ADMIN` : Gestion complète (sauf employés/rôles)
- `EMPLOYEE` : Accès limité (vélos, incidents, maintenance)
- `SUPPORT` : Support client uniquement
- `FINANCE` : Finances uniquement
- `MAINTENANCE` : Maintenance uniquement

**Permissions** : Système granulaire avec contrôle par ressource et action (create, read, update, delete).

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
- `src/locales/index.ts` - Configuration i18next

## 💳 Intégration My-CoolPay

Le backend intègre l'API **My-CoolPay** pour les paiements mobiles.

### Frais appliqués

Lors d'une recharge de compte :
- **Frais CoolPay** : 1.5% du montant (configurable via `COOLPAY_FEE_PERCENTAGE`)
- **Frais Orange Money** : 100 FCFA fixe (configurable via `ORANGE_FEE_FIXED`)

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
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # Utiliser un mot de passe d'application
SMTP_FROM=FreeBike <noreply@freebike.cm>
```

## 📱 Système de SMS (Twilio)

Le backend peut envoyer des SMS via **Twilio** pour :
- 🔐 Vérification de téléphone
- 🔔 Notifications importantes
- 📨 Codes de vérification

### Configuration

Voir [ENV_VARIABLES.md](ENV_VARIABLES.md) pour la configuration complète.

**Mode développement** : Si les credentials Twilio ne sont pas configurés, le service utilise un mode mock qui affiche le code dans la console.

## 🔔 Système de Notifications

Le backend gère les notifications en temps réel :

- 🔔 Notifications push
- 📱 Notifications in-app
- 📧 Notifications par email
- 📱 Notifications par SMS

**Types de notifications** :
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
- ✅ Protection CORS configurable
- ✅ Headers de sécurité (Helmet)
- ✅ Sanitization des données
- ✅ Gestion des erreurs sécurisée
- ✅ Audit logs complet

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

**Actions auditées** :
- Connexions/déconnexions
- Modifications de données sensibles
- Transactions financières
- Actions administratives
- Accès aux ressources protégées

## 🏥 Health Check

Vérifier l'état du serveur et de la base de données :

```bash
GET /api/v1/health
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
    "payment": "operational",
    "sms": "operational"
  }
}
```

## 📈 Fonctionnalités Avancées

### 1. Codes Promo / Vouchers

```typescript
// Créer un code promo
POST /api/v1/admin/promo-codes
{
  "code": "WELCOME10",
  "type": "percentage",
  "value": 10,
  "maxUses": 100,
  "expiresAt": "2025-12-31"
}

// Utiliser un code promo
POST /api/v1/rides/apply-promo
{
  "code": "WELCOME10"
}
```

### 2. Système d'Évaluation

```typescript
// Noter un trajet
POST /api/v1/rides/{rideId}/review
{
  "rating": 5,
  "comment": "Excellent vélo, très confortable!"
}
```

### 3. Remboursements

```typescript
// Demander un remboursement
POST /api/v1/refunds
{
  "rideId": "123",
  "reason": "Vélo défectueux",
  "amount": 500
}
```

### 4. Géofencing

```typescript
// Définir une zone autorisée
POST /api/v1/admin/geofences
{
  "name": "Zone Centre-ville Douala",
  "type": "service_area",
  "coordinates": [[lat, lng], ...]
}
```

### 5. Support / Tickets

```typescript
// Créer un ticket
POST /api/v1/support/tickets
{
  "subject": "Problème de paiement",
  "message": "...",
  "priority": "high"
}
```

### 6. Chat en Temps Réel

Le backend utilise **Socket.io** pour le chat en temps réel entre utilisateurs et support.

## 📦 Scripts npm

```json
{
  "dev": "Démarrage en développement (nodemon)",
  "build": "Compilation TypeScript + création dossier uploads",
  "start": "Build + migrate + seed + start (production)",
  "postinstall": "Génération Prisma Client",
  "migrate": "Migration Prisma (dev)",
  "migrate:deploy": "Migration Prisma (production)",
  "migrate:prod": "Push schéma Prisma (production, sans migrations)",
  "db:seed": "Exécution du seed intelligent"
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

Le script `start` gère automatiquement :
- Build TypeScript
- Migration de la base de données
- Seed intelligent (crée uniquement les éléments manquants)
- Démarrage du serveur

### Docker (optionnel)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 10000
CMD ["npm", "start"]
```

## 📁 Structure des Routes

Les routes sont organisées dans `src/routes/` :

- `public.routes.ts` - Routes publiques (tarifs, vélos publics)
- `auth.routes.ts` - Authentification (login, register, refresh)
- `user.routes.ts` - Gestion des utilisateurs
- `bike.routes.ts` - Gestion des vélos
- `bikeRequests.route.ts` - Demandes de vélos
- `reservation.route.ts` - Réservations
- `ride.routes.ts` - Trajets
- `incident.routes.ts` - Signalements
- `wallet.routes.ts` - Portefeuille et transactions
- `subscription.routes.ts` - Abonnements
- `admin.routes.ts` - Routes admin (dashboard, statistiques)
- `chat.routes.ts` - Chat support
- `notification.routes.ts` - Notifications
- `monitoring.routes.ts` - Monitoring et santé
- `document.routes.ts` - Documents

Toutes les routes sont préfixées par `/api/v1`.

## 🔄 Synchronisation Automatique

Le backend est synchronisé automatiquement avec le dépôt `EcoMobile-backend` via GitHub Actions.

Voir [.github/SYNC_SETUP.md](../.github/SYNC_SETUP.md) pour plus de détails.

## 📚 Ressources

- [Documentation Prisma](https://www.prisma.io/docs)
- [Documentation Express](https://expressjs.com/)
- [Documentation JWT](https://jwt.io/)
- [Documentation Twilio](https://www.twilio.com/docs)

## 🤝 Support

Pour toute question ou problème :
- 📧 Email : wekobrayan163@gmail.com
- 📱 WhatsApp : +237 690 37 44 20
- 🌐 Documentation complète : [README principal](../README.md)

## 📝 Licence

Copyright © 2025 FreeBike Cameroun. Tous droits réservés.