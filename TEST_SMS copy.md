# Guide de test pour la vérification SMS

## Configuration en développement

En mode développement, le système SMS utilise le mode **mock** qui affiche les codes de vérification dans la console du serveur au lieu d'envoyer de vrais SMS.

### Configuration actuelle

Le fichier `.env` est configuré avec :
```env
SMS_PROVIDER=mock
NODE_ENV=development
```

## Test de l'envoi de SMS

### Méthode 1 : Via l'API (Recommandé)

#### 1. Démarrer le serveur backend

```bash
cd backend
npm run dev
```

#### 2. S'inscrire ou se connecter

**Option A : Inscription**
```bash
POST http://localhost:5000/api/v1/auth/register
Content-Type: application/json

{
  "firstName": "Test",
  "lastName": "User",
  "email": "test@example.com",
  "phone": "+237612345678",
  "password": "Test1234!"
}
```

**Option B : Connexion (si utilisateur existe)**
```bash
POST http://localhost:5000/api/v1/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Test1234!"
}
```

Copiez le `token` de la réponse.

#### 3. Initier la vérification téléphone

```bash
POST http://localhost:5000/api/v1/auth/verify-phone/initiate
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "phone": "+237612345678"
}
```

#### 4. Vérifier la console du serveur

Vous devriez voir dans la console du serveur backend :
```
[MOCK SMS] Verification code for +237612345678: 123456
```

**OU** si vous avez configuré Twilio mais que les credentials ne sont pas valides :
```
[TWILIO DEV] Would send code 123456 to +237612345678
```

#### 5. Utiliser le code pour vérifier

La réponse de l'API en développement contient aussi le code :
```json
{
  "success": true,
  "message": "Code de vérification envoyé",
  "data": {
    "code": "123456"
  }
}
```

Utilisez ce code pour vérifier :
```bash
POST http://localhost:5000/api/v1/auth/verify-phone/verify
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "code": "123456"
}
```

### Méthode 2 : Via Swagger UI

1. Allez sur `http://localhost:5000/api-docs`
2. Connectez-vous d'abord via `/auth/login`
3. Copiez le token
4. Cliquez sur "Authorize" en haut de la page
5. Entrez : `Bearer YOUR_TOKEN_HERE`
6. Utilisez l'endpoint `/auth/verify-phone/initiate`
7. Vérifiez la console du serveur pour voir le code

### Méthode 3 : Via l'application mobile

1. Lancez l'application mobile
2. Inscrivez-vous ou connectez-vous
3. Allez sur la page de vérification téléphone
4. Entrez votre numéro de téléphone
5. Vérifiez la console du serveur backend pour voir le code

## Test avec Twilio réel (Production)

### 1. Créer un compte Twilio

1. Allez sur [https://www.twilio.com/](https://www.twilio.com/)
2. Créez un compte gratuit
3. Obtenez votre `Account SID` et `Auth Token` depuis le dashboard
4. Achetez un numéro de téléphone ou utilisez un numéro d'essai

### 2. Configurer les variables d'environnement

Modifiez le fichier `.env` :
```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### 3. Installer le package Twilio (si pas déjà installé)

```bash
npm install twilio
```

### 4. Tester

Suivez les mêmes étapes que pour le mode mock, mais cette fois le SMS sera réellement envoyé à votre téléphone.

## Vérification des logs

### En mode développement (mock)

Les codes apparaissent dans la console avec le format :
```
[MOCK SMS] Verification code for +237612345678: 123456
```

### En mode Twilio (production)

Si les credentials sont valides, le SMS est envoyé. Sinon, vous verrez :
```
[TWILIO DEV] Would send code 123456 to +237612345678
```

## Dépannage

### Le code n'apparaît pas dans la console

1. Vérifiez que `NODE_ENV=development` dans `.env`
2. Vérifiez que `SMS_PROVIDER=mock` dans `.env`
3. Redémarrez le serveur après modification de `.env`

### Erreur "Twilio credentials not configured"

C'est normal en mode développement avec `SMS_PROVIDER=mock`. Si vous voulez utiliser Twilio, configurez les variables d'environnement.

### Le code n'est pas retourné dans la réponse API

En production (`NODE_ENV=production`), le code n'est jamais retourné dans la réponse pour des raisons de sécurité. En développement, il est retourné dans `data.code`.

## Notes importantes

- ⚠️ En production, ne retournez JAMAIS le code dans la réponse API
- ✅ En développement, le code est visible dans la console ET dans la réponse API
- 🔒 Les codes expirent après 10 minutes
- 📱 Le format du numéro de téléphone doit inclure le code pays (ex: +237 pour le Cameroun)
