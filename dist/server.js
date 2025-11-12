"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
if (process.env.NODE_ENV === 'production') {
    dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env.production') });
}
else {
    dotenv_1.default.config();
}
const config_1 = require("./config/config");
const swagger_1 = require("./config/swagger");
const prisma_1 = require("./config/prisma");
const database_1 = require("./config/database");
const errorHandler_1 = require("./middleware/errorHandler");
const i18n_1 = require("./middleware/i18n");
const app = (0, express_1.default)();
// Security Middleware
app.use((0, helmet_1.default)());
// CORS Configuration pour production
app.use((0, cors_1.default)({
    origin: [
        'https://xybronix.github.io',
        'https://xybronix.github.io/EcoMobile',
        'https://ecomobile-frontend.onrender.com',
        'http://localhost:3000',
        'http://localhost:5173'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Accept-Language']
}));
// Body Parser
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Logging
if (config_1.config.env === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
else {
    app.use((0, morgan_1.default)('combined'));
}
// i18n Middleware
app.use(i18n_1.i18nMiddleware);
// Health Check
app.get('/health', (_req, res) => {
    res.json({
        success: true,
        message: 'EcoMobile API is running',
        timestamp: new Date().toISOString(),
        environment: config_1.config.env,
        database: process.env.DATABASE_TYPE || 'unknown'
    });
});
// API Documentation
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'EcoMobile API Documentation'
}));
// Seed endpoint (seulement en développement)
app.post('/api/seed', async (_req, res) => {
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
        if (stderr)
            console.error('Seed errors:', stderr);
        res.json({
            success: true,
            message: 'Database seeded successfully',
            output: stdout
        });
    }
    catch (error) {
        console.error('Seed failed:', error);
        res.status(500).json({
            success: false,
            message: 'Seed failed',
            error: error.message || 'Unknown error occurred'
        });
    }
});
// 404 Handler
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});
// Error Handler
app.use(errorHandler_1.errorHandler);
// Start Server
const PORT = Number(process.env.PORT || config_1.config.port);
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
const startServer = async () => {
    try {
        console.log('🔄 Starting server initialization...');
        // 1. Connect Prisma
        await prisma_1.prisma.$connect();
        console.log('✅ Prisma database connected successfully');
        // 2. Connect DatabaseManager
        if (database_1.dbManager && typeof database_1.dbManager.connect === 'function') {
            await database_1.dbManager.connect();
            console.log('✅ DatabaseManager connected successfully');
        }
        // 3. IMPORTANT: Charger les routes APRÈS la connexion à la base de données
        const routes = await Promise.resolve().then(() => __importStar(require('./routes')));
        app.use(`/api/${config_1.config.apiVersion}`, routes.default);
        console.log('✅ Routes loaded successfully');
        app.listen(PORT, HOST, () => {
            console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚲 EcoMobile API Server                                 ║
║                                                           ║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(24)} ║
║   Port:        ${PORT.toString().padEnd(29)}              ║
║   Host:        ${HOST.padEnd(29)}                         ║
║   API Version: ${config_1.config.apiVersion.padEnd(31)}            ║
║                                                           ║
║   📖 API Documentation:                                   ║
║      http://${HOST}:${PORT}/api-docs                      ║
║                                                           ║
║   🌐 Base URL:                                            ║
║      http://${HOST}:${PORT}/api/${config_1.config.apiVersion.padEnd(23)} ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
// Graceful Shutdown
process.on('SIGTERM', async () => {
    await prisma_1.prisma.$disconnect();
    if (database_1.dbManager && typeof database_1.dbManager.disconnect === 'function') {
        await database_1.dbManager.disconnect();
    }
    process.exit(0);
});
process.on('SIGINT', async () => {
    await prisma_1.prisma.$disconnect();
    if (database_1.dbManager && typeof database_1.dbManager.disconnect === 'function') {
        await database_1.dbManager.disconnect();
    }
    process.exit(0);
});
startServer();
exports.default = app;
//# sourceMappingURL=server.js.map