import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/config';
import { swaggerSpec } from './config/swagger';
import { prisma } from './config/prisma';
import { dbManager } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { i18nMiddleware } from './middleware/i18n';

const app: Application = express();

// Security Middleware
app.use(helmet());

// CORS Configuration
/*app.use(cors({
  origin: config.cors.origin,
  credentials: true
}));*/
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
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'FreeBike API is running',
    timestamp: new Date().toISOString(),
    environment: config.env
  });
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'FreeBike API Documentation'
}));

// Start Server
const PORT = config.port;

const startServer = async () => {
  try {
    console.log('🔄 Starting server initialization...');
    
    // Initialize both database connections
    
    // 1. Connect Prisma
    await prisma.$connect();
    console.log('✅ Prisma database connected successfully');

    // 2. Connect DatabaseManager
    await dbManager.connect();
    console.log('✅ DatabaseManager connected successfully');

    // 3. NOW import routes (after DB connections are established)
    const routes = await import('./routes');
    app.use(`/api/${config.apiVersion}`, routes.default);
    console.log('✅ Routes loaded successfully');

    // Seed initial data if needed
    //await seedInitialData();
    //console.log('✅ Initial data seeded');

    // 404 Handler
    app.use((_req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    });

    // Error Handler
    app.use(errorHandler);

    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚲 FreeBike API Server                                  ║
║                                                           ║
║   Environment: ${config.env.padEnd(24)}                   ║
║   Port:        ${PORT.toString().padEnd(29)}              ║
║   API Version: ${config.apiVersion.padEnd(31)}            ║
║                                                           ║
║   📖 API Documentation:                                   ║
║      http://localhost:${PORT}/api-docs                       ║
║                                                           ║
║   🌐 Base URL:                                            ║
║      http://localhost:${PORT}/api/${config.apiVersion.padEnd(23)}    ║
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
  await dbManager.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  await dbManager.disconnect();
  process.exit(0);
});

// Seed Initial Data
/*
async function seedInitialData() {
  try {
    // Check if admin exists
    const adminExists = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });

    if (!adminExists && process.env.DEFAULT_ADMIN_EMAIL) {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(
        process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123456',
        10
      );

      await prisma.user.create({
        data: {
          email: process.env.DEFAULT_ADMIN_EMAIL,
          password: hashedPassword,
          firstName: 'Super',
          lastName: 'Admin',
          role: 'SUPER_ADMIN',
          emailVerified: true,
          wallet: {
            create: {
              balance: 0
            }
          }
        }
      });

      console.log('✅ Default admin user created');
    }

    // Check if pricing config exists
    const pricingExists = await prisma.pricingConfig.findFirst({
      where: { isActive: true }
    });

    if (!pricingExists) {
      await prisma.pricingConfig.create({
        data: {
          unlockFee: 1,
          perMinuteFee: 0.15,
          isActive: true
        }
      });

      console.log('✅ Default pricing configuration created');
    }

  } catch (error) {
    console.error('Error seeding initial data:', error);
  }
}
*/

// Ajoutez cette route dans votre server.ts avant le démarrage du serveur
app.post('/api/seed', async (_req: Request, res: Response): Promise<void> => {
  if (process.env.NODE_ENV !== 'development') {
    res.status(403).json({
      success: false,
      message: 'Seeding only allowed in development mode'
    });
    return;
  }

  try {
    // Exécuter le seed
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    // Exécuter la commande de seed
    const { stdout, stderr } = await execAsync('npx ts-node prisma/seed.ts');
    
    console.log('Seed output:', stdout);
    if (stderr) console.error('Seed errors:', stderr);

    res.json({
      success: true,
      message: 'Database seeded successfully',
      output: stdout
    });
    return;
  } catch (error: any) {
    console.error('Seed failed:', error);
    res.status(500).json({
      success: false,
      message: 'Seed failed',
      error: error.message || 'Unknown error occurred'
    });
    return;
  }
});

startServer();

export default app;
