# 🚀 Démarrage rapide - Test SMS

## Configuration rapide

### 1. Créer le fichier `.env`

Créez un fichier `.env` dans le dossier `backend/` avec ce contenu minimum :

```env
NODE_ENV=development
SMS_PROVIDER=mock
```

### 2. Démarrer le serveur

```bash
cd backend
npm run dev
```

### 3. Tester l'envoi de SMS

#### Option A : Via curl

```bash
# 1. S'inscrire
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "phone": "+237612345678",
    "password": "Test1234!"
  }'

# 2. Se connecter (copiez le token de la réponse)
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!"
  }'

# 3. Initier la vérification (remplacez YOUR_TOKEN)
curl -X POST http://localhost:5000/api/v1/auth/verify-phone/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "phone": "+237612345678"
  }'
```

#### Option B : Via Swagger

1. Allez sur `http://localhost:5000/api-docs`
2. Connectez-vous via `/auth/login`
3. Cliquez sur "Authorize" et entrez votre token
4. Utilisez `/auth/verify-phone/initiate`

### 4. Vérifier le code

Le code apparaît dans :
- ✅ La console du serveur backend
- ✅ La réponse API (en développement seulement)

Exemple de sortie console :
```
[MOCK SMS] Verification code for +237612345678: 123456
```

## 📝 Notes importantes

- En mode `mock`, aucun SMS réel n'est envoyé
- Le code est visible dans la console ET dans la réponse API
- Pour utiliser Twilio réel, changez `SMS_PROVIDER=twilio` et configurez les credentials

## 🔧 Configuration Twilio (optionnel)

Si vous voulez tester avec de vrais SMS :

1. Créez un compte sur [Twilio](https://www.twilio.com/)
2. Obtenez vos credentials depuis le dashboard
3. Modifiez `.env` :

```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

4. Installez Twilio : `npm install twilio`
5. Redémarrez le serveur

## 📚 Documentation complète

Voir `TEST_SMS.md` pour plus de détails.
