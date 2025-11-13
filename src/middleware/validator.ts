import express, { Request } from 'express';
import { validationResult, body, param, query } from 'express-validator';
import { t } from '../locales';

export const validate = (req: Request & { language?: 'fr' | 'en' }, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const language = req.language || 'fr';
    const formattedErrors = errors.array().map(err => ({
      field: err.type === 'field' ? (err as any).path : 'unknown',
      message: err.msg
    }));

    return res.status(400).json({
      success: false,
      error: t('error.validation', language),
      errors: formattedErrors
    });
  }

  return next();
};

// Auth validators
export const loginValidator = [
  body('email')
    .isEmail()
    .withMessage('Format d\'email invalide')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Le mot de passe est requis')
];

export const registerValidator = [
  body('email')
    .isEmail()
    .withMessage('Format d\'email invalide')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('Le prénom est requis'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Le nom est requis'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Format de téléphone invalide')
];

// Profile update validators
export const updateProfileValidator = [
  body('firstName')
    .notEmpty()
    .withMessage('Le prénom est requis')
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  body('lastName')
    .notEmpty()
    .withMessage('Le nom de famille est requis')
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom de famille doit contenir entre 2 et 50 caractères'),
  body('email')
    .isEmail()
    .withMessage('Format d\'email invalide')
    .normalizeEmail(),
  body('phone')
    .optional()
    .matches(/^(\+237|237)?[6][0-9]{8}$/)
    .withMessage('Format de téléphone invalide'),
  body('address')
    .optional()
    .isLength({ max: 200 })
    .withMessage('L\'adresse ne peut pas dépasser 200 caractères')
];

// Change password validator
export const changePasswordValidator = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Le mot de passe actuel est requis'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Le nouveau mot de passe doit contenir au moins 8 caractères')
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le nouveau mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Les mots de passe ne correspondent pas');
      }
      return true;
    })
];

// Other existing validators remain the same...
export const createBikeValidator = [
  body('code')
    .notEmpty()
    .withMessage('Le code est requis')
    .isLength({ min: 2, max: 50 })
    .withMessage('Le code doit contenir entre 2 et 50 caractères'),
  
  body('model')
    .notEmpty()
    .withMessage('Le modèle est requis')
    .isLength({ min: 2, max: 100 })
    .withMessage('Le modèle doit contenir entre 2 et 100 caractères'),
    
  body('status')
    .optional()
    .isIn(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'UNAVAILABLE'])
    .withMessage('Statut invalide'),
    
  body('latitude')
    .optional({ nullable: true })
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude invalide'),
    
  body('longitude')
    .optional({ nullable: true })
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude invalide'),
    
  body('locationName')
    .optional()
    .isString()
    .withMessage('Le nom de l\'emplacement doit être une chaîne'),
    
  body('gpsDeviceId')
    .optional()
    .isString()
    .withMessage('L\'ID du dispositif GPS doit être une chaîne'),
    
  body('equipment')
    .optional()
    .isArray()
    .withMessage('L\'équipement doit être un tableau')
];

export const startRideValidator = [
  body('bikeId')
    .trim()
    .notEmpty()
    .withMessage('L\'ID du vélo est requis'),
  body('startLocation.latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude invalide'),
  body('startLocation.longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude invalide')
];

export const endRideValidator = [
  body('endLocation.latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude invalide'),
  body('endLocation.longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude invalide')
];

export const createIncidentValidator = [
  body('type')
    .isIn(['accident', 'theft', 'vandalism', 'mechanical', 'other'])
    .withMessage('Type d\'incident invalide'),
  body('severity')
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Gravité invalide'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Le titre est requis'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('La description est requise')
];

export const paginationValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Numéro de page invalide'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite invalide'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc', 'ASC', 'DESC'])
    .withMessage('Ordre de tri invalide')
];

export const idValidator = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('L\'ID est requis')
];
