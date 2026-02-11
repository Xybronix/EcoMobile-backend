// Internationalization (i18n) Module

interface Translation {
  fr: string;
  en: string;
}

interface Translations {
  [key: string]: Translation;
}

export const translations: Translations = {
  // Authentication
  'auth.login.success': {
    fr: 'Connexion réussie',
    en: 'Login successful'
  },
  'auth.login.failed': {
    fr: 'Email ou mot de passe incorrect',
    en: 'Invalid email or password'
  },
  'auth.logout.success': {
    fr: 'Déconnexion réussie',
    en: 'Logout successful'
  },
  'auth.register.success': {
    fr: 'Inscription réussie',
    en: 'Registration successful'
  },
  'auth.register.email_exists': {
    fr: 'Cet email est déjà utilisé',
    en: 'This email is already in use'
  },
  'auth.token.invalid': {
    fr: 'Token invalide ou expiré',
    en: 'Invalid or expired token'
  },
  'auth.token.missing': {
    fr: 'Token manquant',
    en: 'Token missing'
  },
  'auth.unauthorized': {
    fr: 'Non autorisé',
    en: 'Unauthorized'
  },
  'auth.forbidden': {
    fr: 'Accès interdit',
    en: 'Forbidden'
  },
  'auth.password.reset.success': {
    fr: 'Mot de passe réinitialisé avec succès',
    en: 'Password reset successfully'
  },
  'auth.password.reset.email_sent': {
    fr: 'Email de réinitialisation envoyé',
    en: 'Reset email sent'
  },
  'auth.register.failed': {
    fr: 'Échec de l\'inscription',
    en: 'Registration failed'
  },
  'auth.email_already_exists': {
    fr: 'Cet email existe déjà',
    en: 'This email already exists'
  },
  'auth.token_required': {
    fr: 'Token requis',
    en: 'Token required'
  },
  'auth.password_changed': {
    fr: 'Mot de passe modifié avec succès',
    en: 'Password changed successfully'
  },
  'auth.email_verified': {
    fr: 'Email vérifié avec succès',
    en: 'Email verified successfully'
  },
  'auth.password.current.invalid': {
    fr: 'Mot de passe actuel incorrect',
    en: 'Current password incorrect'
  },
  'auth.forgot_password.success': {
    fr: 'Si un compte avec cet email existe, un lien de réinitialisation a été envoyé.',
    en: 'If an account with this email exists, a reset link has been sent.'
  },
  'auth.account.deactivated': {
    fr: 'Votre compte a été désactivé. Veuillez contacter le support.',
    en: 'Your account has been deactivated. Please contact support.'
  },
  'auth.user.not_found': {
    fr: 'Utilisateur non trouvé',
    en: 'User not found'
  },
  'auth.insufficient_permissions': {
    fr: 'Permissions insuffisantes',
    en: 'Insufficient permissions'
  },

  // Users
  'user.not_found': {
    fr: 'Utilisateur non trouvé',
    en: 'User not found'
  },
  'user.updated': {
    fr: 'Utilisateur mis à jour',
    en: 'User updated'
  },
  'user.deleted': {
    fr: 'Utilisateur supprimé',
    en: 'User deleted'
  },
  'user.created': {
    fr: 'Utilisateur créé',
    en: 'User created'
  },
  'user.profile.updated': {
    fr: 'Profil mis à jour',
    en: 'Profile updated'
  },
  'user.profile_updated': {
    fr: 'Profil mis à jour avec succès',
    en: 'Profile updated successfully'
  },
  'user.account_deactivated': {
    fr: 'Compte désactivé',
    en: 'Account deactivated'
  },
  'user.invalid_credentials': {
    fr: 'Identifiants invalides',
    en: 'Invalid credentials'
  },
  'user.profile_retrieved': {
    fr: 'Profil récupéré avec succès',
    en: 'Profile retrieved successfully'
  },

  // Bikes
  'bike.not_found': {
    fr: 'Vélo non trouvé',
    en: 'Bike not found'
  },
  'bike.unavailable': {
    fr: 'Vélo non disponible',
    en: 'Bike unavailable'
  },
  'bike.created': {
    fr: 'Vélo créé',
    en: 'Bike created'
  },
  'bike.updated': {
    fr: 'Vélo mis à jour',
    en: 'Bike updated'
  },
  'bike.deleted': {
    fr: 'Vélo supprimé',
    en: 'Bike deleted'
  },
  'bike.not_available': {
    fr: 'Vélo non disponible',
    en: 'Bike not available'
  },
  'bike.already_in_use': {
    fr: 'Vélo déjà en cours d\'utilisation',
    en: 'Bike already in use'
  },
  'bike.unlocked': {
    fr: 'Vélo déverrouillé avec succès',
    en: 'Bike unlocked successfully'
  },
  'bike.locked': {
    fr: 'Vélo verrouillé avec succès',
    en: 'Bike locked successfully'
  },
  'bike.list_retrieved': {
    fr: 'Liste des vélos récupérée',
    en: 'Bike list retrieved'
  },
  'bike.nearby_retrieved': {
    fr: 'Vélos à proximité récupérés',
    en: 'Nearby bikes retrieved'
  },

  // Rides
  'ride.started': {
    fr: 'Trajet commencé',
    en: 'Ride started'
  },
  'ride.ended': {
    fr: 'Trajet terminé',
    en: 'Ride ended'
  },
  'ride.not_found': {
    fr: 'Trajet non trouvé',
    en: 'Ride not found'
  },
  'ride.already_in_progress': {
    fr: 'Vous avez déjà un trajet en cours',
    en: 'You already have a ride in progress'
  },
  'ride.not_in_progress': {
    fr: 'Aucun trajet en cours',
    en: 'No ride in progress'
  },
  'ride.no_active_ride': {
    fr: 'Aucun trajet actif',
    en: 'No active ride'
  },
  'ride.history_retrieved': {
    fr: 'Historique des trajets récupéré',
    en: 'Ride history retrieved'
  },
  'ride.cancelled': {
    fr: 'Trajet annulé',
    en: 'Ride cancelled'
  },

  // Wallet & Payments
  'wallet.insufficient_balance': {
    fr: 'Solde insuffisant',
    en: 'Insufficient balance'
  },
  'wallet.charged': {
    fr: 'Portefeuille rechargé',
    en: 'Wallet charged'
  },
  'wallet.not_found': {
    fr: 'Portefeuille non trouvé',
    en: 'Wallet not found'
  },
  'wallet.deposit_success': {
    fr: 'Dépôt réussi',
    en: 'Deposit successful'
  },
  'wallet.withdrawal_success': {
    fr: 'Retrait réussi',
    en: 'Withdrawal successful'
  },
  'payment.success': {
    fr: 'Paiement réussi',
    en: 'Payment successful'
  },
  'payment.failed': {
    fr: 'Paiement échoué',
    en: 'Payment failed'
  },
  'payment.completed': {
    fr: 'Paiement terminé',
    en: 'Payment completed'
  },
  'wallet.deposit_failed': {
    fr: 'Échec du dépôt',
    en: 'Deposit failed'
  },
  'wallet.withdrawal_failed': {
    fr: 'Échec du retrait',
    en: 'Withdrawal failed'
  },
  'wallet.balance_retrieved': {
    fr: 'Solde récupéré avec succès',
    en: 'Balance retrieved successfully'
  },
  'wallet.transaction_history': {
    fr: 'Historique des transactions récupéré',
    en: 'Transaction history retrieved'
  },
  'wallet.transaction_not_found': {
    fr: 'Transaction non trouvée',
    en: 'Transaction not found'
  },
  'payment.initiated': {
    fr: 'Paiement initié avec succès',
    en: 'Payment initiated successfully'
  },
  'payment.invalid_amount': {
    fr: 'Montant invalide',
    en: 'Invalid amount'
  },
  'payment.coolpay_error': {
    fr: 'Erreur My-CoolPay',
    en: 'My-CoolPay error'
  },
  'payment.fees_calculated': {
    fr: 'Frais calculés: {{fees}} XAF sur {{amount}} XAF',
    en: 'Fees calculated: {{fees}} XAF on {{amount}} XAF'
  },
  'payment.total_amount': {
    fr: 'Montant total à payer: {{total}} XAF',
    en: 'Total amount to pay: {{total}} XAF'
  },

  // Incidents
  'incident.created': {
    fr: 'Incident créé',
    en: 'Incident created'
  },
  'incident.updated': {
    fr: 'Incident mis à jour',
    en: 'Incident updated'
  },
  'incident.not_found': {
    fr: 'Incident non trouvé',
    en: 'Incident not found'
  },
  'incident.resolved': {
    fr: 'Incident résolu',
    en: 'Incident resolved'
  },

  // Maintenance
  'maintenance.created': {
    fr: 'Maintenance créée',
    en: 'Maintenance created'
  },
  'maintenance.updated': {
    fr: 'Maintenance mise à jour',
    en: 'Maintenance updated'
  },
  'maintenance.completed': {
    fr: 'Maintenance terminée',
    en: 'Maintenance completed'
  },
  'maintenance.not_found': {
    fr: 'Maintenance non trouvée',
    en: 'Maintenance not found'
  },

  // Chat
  'chat.message.sent': {
    fr: 'Message envoyé',
    en: 'Message sent'
  },
  'chat.conversation.created': {
    fr: 'Conversation créée',
    en: 'Conversation created'
  },
  'chat.conversation.not_found': {
    fr: 'Conversation non trouvée',
    en: 'Conversation not found'
  },
  'chat.message_received': {
    fr: 'Message reçu',
    en: 'Message received'
  },
  'chat.history_retrieved': {
    fr: 'Historique de chat récupéré',
    en: 'Chat history retrieved'
  },

  // Notifications
  'notification.sent': {
    fr: 'Notification envoyée',
    en: 'Notification sent'
  },
  'notification.marked_read': {
    fr: 'Notification marquée comme lue',
    en: 'Notification marked as read'
  },
  'notification.ride_started': {
    fr: 'Trajet commencé',
    en: 'Ride started'
  },
  'notification.ride_ended': {
    fr: 'Trajet terminé - Coût: {{cost}}€',
    en: 'Ride ended - Cost: €{{cost}}'
  },
  'notification.wallet_deposit': {
    fr: 'Dépôt de {{amount}}€ effectué',
    en: '€{{amount}} deposit made'
  },
  'notification.wallet_withdrawal': {
    fr: 'Retrait de {{amount}}€ effectué',
    en: '€{{amount}} withdrawal made'
  },
  'notification.ride_payment': {
    fr: 'Paiement de {{amount}}€ pour le trajet',
    en: '€{{amount}} payment for ride'
  },
  'notification.account_created': {
    fr: 'Compte créé',
    en: 'Account created'
  },
  'notification.password_reset_requested': {
    fr: 'Réinitialisation du mot de passe demandée',
    en: 'Password reset requested'
  },
  'notification.incident_reported': {
    fr: 'Incident signalé',
    en: 'Incident reported'
  },
  'notification.incident_resolved': {
    fr: 'Incident résolu',
    en: 'Incident resolved'
  },
  'notification.list_retrieved': {
    fr: 'Liste des notifications récupérée',
    en: 'Notification list retrieved'
  },
  'notification.all_marked_read': {
    fr: 'Toutes les notifications marquées comme lues',
    en: 'All notifications marked as read'
  },
  'notification.deleted': {
    fr: 'Notification supprimée',
    en: 'Notification deleted'
  },
  'notification.bike_booked': {
    fr: 'Vélo réservé avec succès',
    en: 'Bike booked successfully'
  },
  'notification.promotion': {
    fr: 'Offre spéciale FreeBike',
    en: 'Special FreeBike Offer'
  },
  'notification.maintenance_scheduled': {
    fr: 'Maintenance programmée pour le vélo {{bikeCode}}',
    en: 'Maintenance scheduled for bike {{bikeCode}}'
  },

  // Admin
  'admin.access_denied': {
    fr: 'Accès refusé - Privilèges administrateur requis',
    en: 'Access denied - Admin privileges required'
  },
  'admin.users_retrieved': {
    fr: 'Liste des utilisateurs récupérée',
    en: 'User list retrieved'
  },
  'admin.bikes_retrieved': {
    fr: 'Liste des vélos récupérée',
    en: 'Bike list retrieved'
  },
  'admin.stats_retrieved': {
    fr: 'Statistiques récupérées',
    en: 'Statistics retrieved'
  },
  'admin.dashboard_retrieved': {
    fr: 'Tableau de bord récupéré',
    en: 'Dashboard retrieved'
  },
  'admin.settings_updated': {
    fr: 'Paramètres mis à jour',
    en: 'Settings updated'
  },
  'admin.pricing_updated': {
    fr: 'Tarification mise à jour',
    en: 'Pricing updated'
  },

  // Validation Errors
  'validation.email.invalid': {
    fr: 'Email invalide',
    en: 'Invalid email'
  },
  'validation.password.too_short': {
    fr: 'Le mot de passe doit contenir au moins 8 caractères',
    en: 'Password must be at least 8 characters'
  },
  'validation.required': {
    fr: 'Ce champ est requis',
    en: 'This field is required'
  },
  'validation.invalid': {
    fr: 'Valeur invalide',
    en: 'Invalid value'
  },
  'validation.email_invalid': {
    fr: 'Email invalide',
    en: 'Invalid email'
  },
  'validation.password_weak': {
    fr: 'Le mot de passe doit contenir au moins 8 caractères',
    en: 'Password must be at least 8 characters long'
  },
  'validation.field_required': {
    fr: 'Le champ {{field}} est requis',
    en: 'Field {{field}} is required'
  },
  'validation.invalid_format': {
    fr: 'Format invalide',
    en: 'Invalid format'
  },
  'validation.invalid_phone': {
    fr: 'Numéro de téléphone invalide',
    en: 'Invalid phone number'
  },
  'validation.invalid_date': {
    fr: 'Date ou heure invalide',
    en: 'Invalid date or time'
  },
  'validation.invalid_pagination': {
    fr: 'Paramètres de pagination invalides',
    en: 'Invalid pagination parameters'
  },
  'validation.message.required': {
    fr: 'Le message ne peut pas être vide',
    en: 'Message cannot be empty'
  },
  'validation.password.min_length': {
    fr: 'Le mot de passe doit contenir au moins 8 caractères',
    en: 'Password must be at least 8 characters long'
  },
  'validation.password.complexity': {
    fr: 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre',
    en: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  },

  // General Errors
  'error.server': {
    fr: 'Erreur serveur',
    en: 'Server error'
  },
  'error.not_found': {
    fr: 'Ressource non trouvée',
    en: 'Resource not found'
  },
  'error.database': {
    fr: 'Erreur de base de données',
    en: 'Database error'
  },
  'error.validation': {
    fr: 'Erreur de validation',
    en: 'Validation error'
  },
  'error.internal_server': {
    fr: 'Erreur interne du serveur',
    en: 'Internal server error'
  },
  'error.bad_request': {
    fr: 'Requête invalide',
    en: 'Invalid request'
  },
  'error.database_error': {
    fr: 'Erreur de base de données',
    en: 'Database error'
  },
  'error.service_unavailable': {
    fr: 'Service temporairement indisponible',
    en: 'Service temporarily unavailable'
  },
  'error.email_not_verified': {
    fr: 'Email non vérifié',
    en: 'Email not verified'
  },
  'error.email_already_verified': {
    fr: 'Email déjà vérifié',
    en: 'Email already verified'
  },
  'error.invalid_verification_token': {
    fr: 'Token de vérification invalide',
    en: 'Invalid verification token'
  },
  'error.verification_token_expired': {
    fr: 'Token de vérification expiré',
    en: 'Verification token expired'
  },
  'error.ride.start_failed': {
    fr: 'Échec du démarrage du trajet',
    en: 'Failed to start ride'
  },
  'error.ride.end_failed': {
    fr: 'Échec de la fin du trajet',
    en: 'Failed to end ride'
  },
  'error.ride.cancel_failed': {
    fr: 'Échec de l\'annulation du trajet',
    en: 'Failed to cancel ride'
  },
  'error.document.invalid_image_format': {
    fr: 'Format d\'image invalide',
    en: 'Invalid image format'
  },
  'document.status_retrieved': {
    fr: 'Statut des documents récupéré',
    en: 'Document status retrieved'
  },
  'error.email_verification_failed': {
    fr: 'Échec de l\'envoi de l\'email de vérification',
    en: 'Failed to send verification email'
  },
  'error.password_reset_failed': {
    fr: 'Échec de l\'envoi de l\'email de réinitialisation',
    en: 'Failed to send reset email'
  },
  'error.welcome_notification_failed': {
    fr: 'Échec de l\'envoi de la notification de bienvenue',
    en: 'Failed to send welcome notification'
  },

  // Success Messages
  'success.operation_completed': {
    fr: 'Opération terminée avec succès',
    en: 'Operation completed successfully'
  },
  'success.data_retrieved': {
    fr: 'Données récupérées avec succès',
    en: 'Data retrieved successfully'
  },
  'success.created': {
    fr: 'Créé avec succès',
    en: 'Created successfully'
  },
  'success.updated': {
    fr: 'Mis à jour avec succès',
    en: 'Updated successfully'
  },
  'success.deleted': {
    fr: 'Supprimé avec succès',
    en: 'Deleted successfully'
  },

  // Email
  'email.welcome_subject': {
    fr: 'Bienvenue sur FreeBike - Votre compte a été créé',
    en: 'Welcome to FreeBike - Your account has been created'
  },
  'email.welcome_title': {
    fr: 'Bienvenue sur FreeBike!',
    en: 'Welcome to FreeBike!'
  },
  'email.welcome_message': {
    fr: 'Bonjour {{firstName}},\n\nNous sommes ravis de vous accueillir sur FreeBike! Votre compte a été créé avec succès.\n\nVous pouvez maintenant profiter de nos vélos électriques partout dans la ville.',
    en: 'Hello {{firstName}},\n\nWe\'re excited to welcome you to FreeBike! Your account has been successfully created.\n\nYou can now enjoy our electric bikes throughout the city.'
  },
  'email.welcome_cta': {
    fr: 'Commencer à rouler',
    en: 'Start Riding'
  },
  'email.password_reset_subject': {
    fr: 'Réinitialisation de votre mot de passe FreeBike',
    en: 'Reset your FreeBike password'
  },
  'email.password_reset_title': {
    fr: 'Réinitialisation de mot de passe',
    en: 'Password Reset'
  },
  'email.password_reset_message': {
    fr: 'Bonjour {{firstName}},\n\nVous avez demandé la réinitialisation de votre mot de passe.\n\nCliquez sur le bouton ci-dessous pour créer un nouveau mot de passe. Ce lien expirera dans 1 heure.',
    en: 'Hello {{firstName}},\n\nYou requested to reset your password.\n\nClick the button below to create a new password. This link will expire in 1 hour.'
  },
  'email.password_reset_cta': {
    fr: 'Réinitialiser mon mot de passe',
    en: 'Reset my password'
  },
  'email.password_reset_ignore': {
    fr: 'Si vous n\'avez pas demandé cette réinitialisation, ignorez cet email.',
    en: 'If you didn\'t request this reset, please ignore this email.'
  },
  'email.ride_completed_subject': {
    fr: 'Trajet terminé - FreeBike',
    en: 'Ride completed - FreeBike'
  },
  'email.ride_completed_title': {
    fr: 'Trajet terminé avec succès!',
    en: 'Ride completed successfully!'
  },
  'email.ride_completed_message': {
    fr: 'Bonjour {{firstName}},\n\nVotre trajet est terminé.\n\nDurée: {{duration}} minutes\nDistance: {{distance}} km\nCoût: {{cost}} XAF',
    en: 'Hello {{firstName}},\n\nYour ride is completed.\n\nDuration: {{duration}} minutes\nDistance: {{distance}} km\nCost: {{cost}} XAF'
  },
  'email.ride_completed_cta': {
    fr: 'Voir les détails',
    en: 'View details'
  },
  'email.deposit_subject': {
    fr: 'Dépôt effectué - FreeBike',
    en: 'Deposit completed - FreeBike'
  },
  'email.deposit_title': {
    fr: 'Dépôt confirmé',
    en: 'Deposit confirmed'
  },
  'email.deposit_message': {
    fr: 'Bonjour {{firstName}},\n\nVotre dépôt de {{amount}} XAF a été effectué avec succès.\n\nNouveau solde: {{balance}} XAF',
    en: 'Hello {{firstName}},\n\nYour deposit of {{amount}} XAF has been completed successfully.\n\nNew balance: {{balance}} XAF'
  },
  'email.deposit_cta': {
    fr: 'Voir mon portefeuille',
    en: 'View my wallet'
  },
  'email.promotion_subject': {
    fr: '{{subject}}',
    en: '{{subject}}'
  },
  'email.promotion_title': {
    fr: '{{title}}',
    en: '{{title}}'
  },
  'email.promotion_message': {
    fr: '{{message}}',
    en: '{{message}}'
  },
  'email.promotion_cta': {
    fr: 'En savoir plus',
    en: 'Learn more'
  },
  'email.incident_resolved_subject': {
    fr: 'Votre incident a été résolu - FreeBike',
    en: 'Your incident has been resolved - FreeBike'
  },
  'email.incident_resolved_title': {
    fr: 'Incident résolu',
    en: 'Incident resolved'
  },
  'email.incident_resolved_message': {
    fr: 'Bonjour {{firstName}},\n\nNous vous informons que votre incident #{{incidentId}} a été résolu.\n\nMerci de votre patience.',
    en: 'Hello {{firstName}},\n\nWe inform you that your incident #{{incidentId}} has been resolved.\n\nThank you for your patience.'
  },
  'email.incident_resolved_cta': {
    fr: 'Voir les détails',
    en: 'View details'
  },
  'email.footer_text': {
    fr: 'Merci d\'utiliser FreeBike',
    en: 'Thank you for using FreeBike'
  },
  'email.footer_contact': {
    fr: 'Besoin d\'aide? Contactez-nous',
    en: 'Need help? Contact us'
  },
  'email.unsubscribe': {
    fr: 'Se désabonner',
    en: 'Unsubscribe'
  },

  // Session
  'session.fetch.error': {
    fr: 'Erreur lors de la récupération des sessions',
    en: 'Error fetching sessions'
  },
  'session.not_found': {
    fr: 'Session non trouvée',
    en: 'Session not found'
  },
  'session.disconnect.error': {
    fr: 'Erreur lors de la déconnexion de la session',
    en: 'Error disconnecting session'
  },
  'session.disconnect_all.error': {
    fr: 'Erreur lors de la déconnexion de toutes les sessions',
    en: 'Error disconnecting all sessions'
  },

  // Device
  'device.unknown': {
    fr: 'Appareil inconnu',
    en: 'Unknown device'
  },
  'device.chrome': {
    fr: 'Chrome',
    en: 'Chrome'
  },
  'device.chrome_windows': {
    fr: 'Chrome sur Windows',
    en: 'Chrome on Windows'
  },
  'device.chrome_mac': {
    fr: 'Chrome sur Mac',
    en: 'Chrome on Mac'
  },
  'device.chrome_android': {
    fr: 'Chrome sur Android',
    en: 'Chrome on Android'
  },
  'device.safari_iphone': {
    fr: 'Safari sur iPhone',
    en: 'Safari on iPhone'
  },
  'device.safari_ipad': {
    fr: 'Safari sur iPad',
    en: 'Safari on iPad'
  },
  'device.safari_mac': {
    fr: 'Safari sur Mac',
    en: 'Safari on Mac'
  },
  'device.safari': {
    fr: 'Safari',
    en: 'Safari'
  },
  'device.firefox_windows': {
    fr: 'Firefox sur Windows',
    en: 'Firefox on Windows'
  },
  'device.firefox_mac': {
    fr: 'Firefox sur Mac',
    en: 'Firefox on Mac'
  },
  'device.firefox': {
    fr: 'Firefox',
    en: 'Firefox'
  },

  // Location
  'location.local': {
    fr: 'Localisation locale',
    en: 'Local location'
  },
  'location.cameroon': {
    fr: 'Cameroun',
    en: 'Cameroon'
  }
};

export function translate(key: string, lang: 'fr' | 'en' = 'fr'): string {
  const translation = translations[key];
  if (!translation) {
    console.warn(`Translation key not found: ${key}`);
    return key;
  }
  return translation[lang] || translation.fr;
}

export function t(key: string, language?: string, params?: Record<string, any>): string {
  const lang = (language as 'fr' | 'en') || 'fr';
  let translation = translate(key, lang);
  
  if (params) {
    Object.keys(params).forEach(param => {
      translation = translation.replace(`{{${param}}}`, params[param]);
    });
  }
  
  return translation;
}