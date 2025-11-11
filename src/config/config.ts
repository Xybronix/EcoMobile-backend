import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  apiVersion: process.env.API_VERSION || 'v1',

  database: {
    type: (process.env.DB_TYPE || 'mysql') as 'mysql' | 'postgres' | 'sqlite' | 'mongodb' | 'cassandra',
    
    mysql: {
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306', 10),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'freebike'
    },

    postgres: {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || '',
      database: process.env.POSTGRES_DATABASE || 'freebike'
    },

    sqlite: {
      path: process.env.SQLITE_PATH || path.join(__dirname, '../../database/freebike.db')
    },

    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/freebike'
    },

    cassandra: {
      contactPoints: process.env.CASSANDRA_CONTACT_POINTS || 'localhost',
      keyspace: process.env.CASSANDRA_KEYSPACE || 'freebike',
      localDataCenter: process.env.CASSANDRA_LOCAL_DATACENTER || 'datacenter1'
    }
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key_change_this',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },

  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.EMAIL_FROM || 'noreply@freebike.com',
    fromName: process.env.EMAIL_FROM_NAME || 'FreeBike'
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  app: {
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    defaultLanguage: (process.env.DEFAULT_LANGUAGE || 'fr') as 'fr' | 'en',
    supportedLanguages: (process.env.SUPPORTED_LANGUAGES || 'fr,en').split(',')
  },

  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
    uploadDir: process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads')
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || path.join(__dirname, '../../logs')
  },

  coolpay: {
    apiUrl: process.env.COOLPAY_API_URL || 'https://my-coolpay.com/api/v1',
    apiKey: process.env.COOLPAY_API_KEY || '',
    merchantId: process.env.COOLPAY_MERCHANT_ID || '',
    secretKey: process.env.COOLPAY_SECRET_KEY || '',
    feePercentage: parseFloat(process.env.COOLPAY_FEE_PERCENTAGE || '2'),
    orangeFeePercentage: parseFloat(process.env.ORANGE_FEE_PERCENTAGE || '4'),
    totalFeePercentage: parseFloat(process.env.TOTAL_FEE_PERCENTAGE || '6')
  },

  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',')
  }
};
