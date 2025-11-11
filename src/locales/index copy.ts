// Internationalization (i18n) Module

interface Translations {
  [key: string]: {
    notification: any;
    bike: any;
    ride: any;
    wallet: any;
    payment: any;
    auth: any;
    fr: string;
    en: string;
  };
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
  'payment.success': {
    fr: 'Paiement réussi',
    en: 'Payment successful'
  },
  'payment.failed': {
    fr: 'Paiement échoué',
    en: 'Payment failed'
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

  // Notifications
  'notification.sent': {
    fr: 'Notification envoyée',
    en: 'Notification sent'
  },
  'notification.marked_read': {
    fr: 'Notification marquée comme lue',
    en: 'Notification marked as read'
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

  // Success Messages
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

export function t(key: string, lang: 'fr' | 'en' = 'fr'): string {
  return translate(key, lang);
}
