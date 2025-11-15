import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './config';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EcoMobile API',
      version: '1.0.0',
      description: 'API REST complète pour l\'application EcoMobile avec support multi-base de données, authentification JWT, paiements My-CoolPay et internationalisation français/anglais',
      contact: {
        name: 'Xybronix Support',
        email: 'support@xybronix.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/license/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:3000/api/${config.apiVersion}`,
        description: 'Development server (Local)'
      },
      {
        url: `https://ecomobile-8bx0.onrender.com/api/${config.apiVersion}`,
        description: 'Production server (Render)'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object'
              }
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            email: {
              type: 'string',
              format: 'email'
            },
            firstName: {
              type: 'string'
            },
            lastName: {
              type: 'string'
            },
            phone: {
              type: 'string',
              nullable: true
            },
            role: {
              type: 'string',
              enum: ['USER', 'ADMIN', 'SUPER_ADMIN', 'EMPLOYEE']
            },
            isActive: {
              type: 'boolean'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Wallet: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            userId: {
              type: 'string',
              format: 'uuid'
            },
            balance: {
              type: 'number',
              format: 'float'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Transaction: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            walletId: {
              type: 'string',
              format: 'uuid'
            },
            type: {
              type: 'string',
              enum: ['DEPOSIT', 'WITHDRAWAL', 'RIDE_PAYMENT', 'REFUND']
            },
            amount: {
              type: 'number',
              format: 'float'
            },
            fees: {
              type: 'number',
              format: 'float'
            },
            totalAmount: {
              type: 'number',
              format: 'float'
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED']
            },
            paymentMethod: {
              type: 'string',
              nullable: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Bike: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            code: {
              type: 'string'
            },
            model: {
              type: 'string'
            },
            status: {
              type: 'string',
              enum: ['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'UNAVAILABLE']
            },
            batteryLevel: {
              type: 'integer'
            },
            latitude: {
              type: 'number',
              format: 'float',
              nullable: true
            },
            longitude: {
              type: 'number',
              format: 'float',
              nullable: true
            },
            qrCode: {
              type: 'string'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Ride: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            userId: {
              type: 'string',
              format: 'uuid'
            },
            bikeId: {
              type: 'string',
              format: 'uuid'
            },
            startTime: {
              type: 'string',
              format: 'date-time'
            },
            endTime: {
              type: 'string',
              format: 'date-time',
              nullable: true
            },
            distance: {
              type: 'number',
              format: 'float',
              nullable: true
            },
            duration: {
              type: 'integer',
              nullable: true
            },
            cost: {
              type: 'number',
              format: 'float',
              nullable: true
            },
            status: {
              type: 'string',
              enum: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED']
            }
          }
        },
        Incident: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            userId: {
              type: 'string',
              format: 'uuid'
            },
            bikeId: {
              type: 'string',
              format: 'uuid',
              nullable: true
            },
            type: {
              type: 'string',
              enum: ['brakes', 'battery', 'tire', 'chain', 'lights', 'lock', 'electronics', 'physical_damage', 'other'],
            },
            description: {
              type: 'string'
            },
            status: {
              type: 'string',
              enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
            },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH']
            },
            resolvedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true
            },
            refundAmount: {
              type: 'number',
              nullable: true
            },
            adminNote: {
              type: 'string',
              nullable: true
            },
            resolvedBy: {
              type: 'string',
              format: 'uuid',
              nullable: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }, 
            bike: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid'
                },
                code: {
                  type: 'string'
                },
                model: {
                  type: 'string'
                }
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Endpoints d\'authentification et d\'autorisation'
      },
      {
        name: 'Users',
        description: 'Gestion des utilisateurs'
      },
      {
        name: 'Bikes',
        description: 'Gestion des vélos'
      },
      {
        name: 'Rides',
        description: 'Gestion des trajets'
      },
      {
        name: 'Wallet',
        description: 'Gestion du portefeuille et des transactions'
      },
      {
        name: 'Payments',
        description: 'Intégration My-CoolPay pour les paiements'
      },
      {
        name: 'Admin',
        description: 'Endpoints d\'administration'
      },
      {
        name: 'Chat',
        description: 'Messagerie utilisateur-admin'
      },
      {
        name: 'Notifications',
        description: 'Gestion des notifications'
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options);