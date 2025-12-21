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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Accept-Language', 'Origin', 'X-Requested-With']
}));

/*app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://xybronix.github.io');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});*/

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

// Root Endpoint
app.get('/', (_req: express.Request, res: express.Response) => {
  res.json({
    success: true,
    message: '🚲 EcoMobile API - Welcome!',
    version: config.apiVersion,
    environment: config.env,
    timestamp: new Date().toISOString(),
    documentation: '/api-docs',
    health: '/health',
    api: `/api/${config.apiVersion}`
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

// Function to create a formatted line with label and value
const createFormattedLine = (label: string, value: string, totalWidth: number = 61): string => {
  const prefix = '║   ';
  const middle = ': ';
  const labelWithMiddle = `${label}${middle}${value}`;
  
  const spacesNeeded = totalWidth - prefix.length - labelWithMiddle.length - 1;
  
  return `${prefix}${label}${middle}${value}${' '.repeat(Math.max(0, spacesNeeded))}║`;
};

// Function to create a title line
const createTitleLine = (title: string, totalWidth: number = 61): string => {
  const prefix = '║   ';
  const spacesNeeded = totalWidth - prefix.length - title.length - 1;
  
  return `${prefix}${title}${' '.repeat(Math.max(0, spacesNeeded))}║`;
};

// Function to create a URL line
const createUrlLine = (url: string, totalWidth: number = 61): string => {
  const prefix = '║      ';
  const spacesNeeded = totalWidth - prefix.length - url.length - 1;
  
  return `${prefix}${url}${' '.repeat(Math.max(0, spacesNeeded))}║`;
};

// Function to create an empty line
const createEmptyLine = (totalWidth: number = 61): string => {
  return `║${' '.repeat(totalWidth - 2)}║`;
};

// Start Server
const PORT = Number(process.env.PORT || config.port);
const HOST = '0.0.0.0';

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

    // 3. Load Routes
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
      const environment = process.env.NODE_ENV || 'development';
      const portStr = PORT.toString();
      const hostStr = HOST;
      const apiVersion = config.apiVersion;
      const docsUrl = `http://${HOST}:${PORT}/api-docs`;
      const baseUrl = `http://${HOST}:${PORT}/api/${apiVersion}`;

      console.log(`
╔═══════════════════════════════════════════════════════════╗
${createEmptyLine()}
║   🚲 EcoMobile API Server                                 ║
${createEmptyLine()}
${createFormattedLine('Environment', environment)}
${createFormattedLine('Port', portStr)}
${createFormattedLine('Host', hostStr)}
${createFormattedLine('API Version', apiVersion)}
${createEmptyLine()}
${createTitleLine('📖 API Documentation')}
${createUrlLine(docsUrl)}
${createEmptyLine()}
${createTitleLine('🌐 Base URL')}
${createUrlLine(baseUrl)}
${createEmptyLine()}
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