# Variables d'environnement EcoMobile

## Variables SMS (Twilio)

Pour activer la vérification par SMS, configurez les variables suivantes dans votre fichier `.env` :

```env
# Service SMS Provider (twilio, messagebird, mock)
SMS_PROVIDER=twilio

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# MessageBird Configuration (alternative)
MESSAGEBIRD_API_KEY=your_messagebird_api_key
MESSAGEBIRD_ORIGINATOR=your_messagebird_originator
```

### Configuration Twilio

1. Créez un compte sur [Twilio](https://www.twilio.com/)
2. Obtenez votre `Account SID` et `Auth Token` depuis le dashboard
3. Achetez un numéro de téléphone Twilio ou utilisez un numéro d'essai
4. Configurez les variables dans votre `.env`

### Mode développement

En mode développement (`NODE_ENV=development`), si les credentials Twilio ne sont pas configurés, le service utilisera un mode mock qui affiche le code dans la console au lieu d'envoyer un SMS réel.

### Variables requises pour la production

En production, assurez-vous que toutes les variables Twilio sont configurées, sinon le service SMS échouera.
