"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idValidator = exports.paginationValidator = exports.createIncidentValidator = exports.endRideValidator = exports.startRideValidator = exports.createBikeValidator = exports.changePasswordValidator = exports.updateProfileValidator = exports.registerValidator = exports.loginValidator = exports.validate = void 0;
const express_validator_1 = require("express-validator");
const locales_1 = require("../locales");
const validate = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const language = req.language || 'fr';
        const formattedErrors = errors.array().map(err => ({
            field: err.type === 'field' ? err.path : 'unknown',
            message: err.msg
        }));
        return res.status(400).json({
            success: false,
            error: (0, locales_1.t)('error.validation', language),
            errors: formattedErrors
        });
    }
    return next();
};
exports.validate = validate;
// Auth validators
exports.loginValidator = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('Format d\'email invalide')
        .normalizeEmail(),
    (0, express_validator_1.body)('password')
        .notEmpty()
        .withMessage('Le mot de passe est requis')
];
exports.registerValidator = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('Format d\'email invalide')
        .normalizeEmail(),
    (0, express_validator_1.body)('password')
        .isLength({ min: 8 })
        .withMessage('Le mot de passe doit contenir au moins 8 caractères')
        .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
    (0, express_validator_1.body)('firstName')
        .trim()
        .notEmpty()
        .withMessage('Le prénom est requis'),
    (0, express_validator_1.body)('lastName')
        .trim()
        .notEmpty()
        .withMessage('Le nom est requis'),
    (0, express_validator_1.body)('phone')
        .optional()
        .isMobilePhone('any')
        .withMessage('Format de téléphone invalide')
];
// Profile update validators
exports.updateProfileValidator = [
    (0, express_validator_1.body)('firstName')
        .notEmpty()
        .withMessage('Le prénom est requis')
        .isLength({ min: 2, max: 50 })
        .withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
    (0, express_validator_1.body)('lastName')
        .notEmpty()
        .withMessage('Le nom de famille est requis')
        .isLength({ min: 2, max: 50 })
        .withMessage('Le nom de famille doit contenir entre 2 et 50 caractères'),
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('Format d\'email invalide')
        .normalizeEmail(),
    (0, express_validator_1.body)('phone')
        .optional()
        .matches(/^(\+237|237)?[6][0-9]{8}$/)
        .withMessage('Format de téléphone invalide'),
    (0, express_validator_1.body)('address')
        .optional()
        .isLength({ max: 200 })
        .withMessage('L\'adresse ne peut pas dépasser 200 caractères')
];
// Change password validator
exports.changePasswordValidator = [
    (0, express_validator_1.body)('currentPassword')
        .notEmpty()
        .withMessage('Le mot de passe actuel est requis'),
    (0, express_validator_1.body)('newPassword')
        .isLength({ min: 8 })
        .withMessage('Le nouveau mot de passe doit contenir au moins 8 caractères')
        .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Le nouveau mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
    (0, express_validator_1.body)('confirmPassword')
        .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
            throw new Error('Les mots de passe ne correspondent pas');
        }
        return true;
    })
];
// Other existing validators remain the same...
exports.createBikeValidator = [
    (0, express_validator_1.body)('code')
        .notEmpty()
        .withMessage('Le code est requis')
        .isLength({ min: 2, max: 50 })
        .withMessage('Le code doit contenir entre 2 et 50 caractères'),
    (0, express_validator_1.body)('model')
        .notEmpty()
        .withMessage('Le modèle est requis')
        .isLength({ min: 2, max: 100 })
        .withMessage('Le modèle doit contenir entre 2 et 100 caractères'),
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'UNAVAILABLE'])
        .withMessage('Statut invalide'),
    (0, express_validator_1.body)('latitude')
        .optional({ nullable: true })
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude invalide'),
    (0, express_validator_1.body)('longitude')
        .optional({ nullable: true })
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude invalide'),
    (0, express_validator_1.body)('locationName')
        .optional()
        .isString()
        .withMessage('Le nom de l\'emplacement doit être une chaîne'),
    (0, express_validator_1.body)('gpsDeviceId')
        .optional()
        .isString()
        .withMessage('L\'ID du dispositif GPS doit être une chaîne'),
    (0, express_validator_1.body)('equipment')
        .optional()
        .isArray()
        .withMessage('L\'équipement doit être un tableau')
];
exports.startRideValidator = [
    (0, express_validator_1.body)('bikeId')
        .trim()
        .notEmpty()
        .withMessage('L\'ID du vélo est requis'),
    (0, express_validator_1.body)('startLocation.latitude')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude invalide'),
    (0, express_validator_1.body)('startLocation.longitude')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude invalide')
];
exports.endRideValidator = [
    (0, express_validator_1.body)('endLocation.latitude')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude invalide'),
    (0, express_validator_1.body)('endLocation.longitude')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude invalide')
];
exports.createIncidentValidator = [
    (0, express_validator_1.body)('type')
        .isIn(['accident', 'theft', 'vandalism', 'mechanical', 'other'])
        .withMessage('Type d\'incident invalide'),
    (0, express_validator_1.body)('severity')
        .isIn(['low', 'medium', 'high', 'critical'])
        .withMessage('Gravité invalide'),
    (0, express_validator_1.body)('title')
        .trim()
        .notEmpty()
        .withMessage('Le titre est requis'),
    (0, express_validator_1.body)('description')
        .trim()
        .notEmpty()
        .withMessage('La description est requise')
];
exports.paginationValidator = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Numéro de page invalide'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limite invalide'),
    (0, express_validator_1.query)('sortOrder')
        .optional()
        .isIn(['asc', 'desc', 'ASC', 'DESC'])
        .withMessage('Ordre de tri invalide')
];
exports.idValidator = [
    (0, express_validator_1.param)('id')
        .trim()
        .notEmpty()
        .withMessage('L\'ID est requis')
];
//# sourceMappingURL=validator.js.map