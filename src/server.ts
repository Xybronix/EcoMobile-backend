import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
import path from 'path';

if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: path.join(__dirname, '../../.env.production') });
} else {
  dotenv.config();
}

import { config } from './config/config';
import { swaggerSpec } from './config/swagger';
import { prisma } from './config/prisma';
import { dbManager } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { i18nMiddleware } from './middleware/i18n';

const app = express();

// Security Middleware
app.use(helmet());

// CORS Configuration pour production
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Accept-Language']
}));

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// i18n Middleware
app.use(i18nMiddleware);

// Health Check
app.get('/health', (_req: express.Request, res: express.Response) => {
  res.json({
    success: true,
    message: 'EcoMobile API is running',
    timestamp: new Date().toISOString(),
    environment: config.env,
    database: process.env.DATABASE_TYPE || 'unknown'
  });
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'EcoMobile API Documentation'
}));

// Seed endpoint (seulement en développement)
app.post('/api/seed', async (_req: express.Request, res: express.Response): Promise<void> => {
  if (process.env.NODE_ENV !== 'development') {
    res.status(403).json({
      success: false,
      message: 'Seeding only allowed in development mode'
    });
    return;
  }

  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    const { stdout, stderr } = await execAsync('npx ts-node prisma/seed.ts');
    
    console.log('Seed output:', stdout);
    if (stderr) console.error('Seed errors:', stderr);

    res.json({
      success: true,
      message: 'Database seeded successfully',
      output: stdout
    });
  } catch (error: any) {
    console.error('Seed failed:', error);
    res.status(500).json({
      success: false,
      message: 'Seed failed',
      error: error.message || 'Unknown error occurred'
    });
  }
});

// Start Server
const PORT = Number(process.env.PORT || config.port);
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

const startServer = async () => {
  try {
    console.log('🔄 Starting server initialization...');
    
    // 1. Connect Prisma
    await prisma.$connect();
    console.log('✅ Prisma database connected successfully');

    // 2. Connect DatabaseManager
    if (dbManager && typeof dbManager.connect === 'function') {
      await dbManager.connect();
      console.log('✅ DatabaseManager connected successfully');
    }

    // 3. IMPORTANT: Charger les routes APRÈS la connexion à la base de données
    const routes = await import('./routes');
    app.use(`/api/${config.apiVersion}`, routes.default);
    console.log('✅ Routes loaded successfully');

    // 404 Handler
    app.use((_req: express.Request, res: express.Response) => {
      res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    });

    // Error Handler
    app.use(errorHandler);

    app.listen(PORT, HOST, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚲 EcoMobile API Server                                 ║
║                                                           ║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(24)} ║
║   Port:        ${PORT.toString().padEnd(29)}              ║
║   Host:        ${HOST.padEnd(29)}                         ║
║   API Version: ${config.apiVersion.padEnd(31)}            ║
║                                                           ║
║   📖 API Documentation:                                   ║
║      http://${HOST}:${PORT}/api-docs                      ║
║                                                           ║
║   🌐 Base URL:                                            ║
║      http://${HOST}:${PORT}/api/${config.apiVersion.padEnd(23)} ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful Shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  if (dbManager && typeof dbManager.disconnect === 'function') {
    await dbManager.disconnect();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  if (dbManager && typeof dbManager.disconnect === 'function') {
    await dbManager.disconnect();
  }
  process.exit(0);
});

startServer();

export default app;