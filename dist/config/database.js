"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = exports.dbManager = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const pg_1 = require("pg");
const sqlite3_1 = __importDefault(require("sqlite3"));
const cassandra_driver_1 = require("cassandra-driver");
const mongodb_1 = require("mongodb");
const config_1 = require("./config");
class DatabaseManager {
    constructor() {
        this.connection = null;
    }
    static getInstance() {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
        }
        return DatabaseManager.instance;
    }
    async connect() {
        if (this.connection) {
            console.log('✅ DatabaseManager - Already connected, returning existing connection');
            return this.connection;
        }
        const dbType = config_1.config.database.type;
        switch (dbType) {
            case 'mysql':
                this.connection = await this.connectMySQL();
                break;
            case 'postgres':
                this.connection = await this.connectPostgreSQL();
                break;
            case 'sqlite':
                this.connection = await this.connectSQLite();
                break;
            case 'mongodb':
                this.connection = await this.connectMongoDB();
                break;
            case 'cassandra':
                this.connection = await this.connectCassandra();
                break;
            default:
                throw new Error(`Unsupported database type: ${dbType}`);
        }
        console.log(`✅ Connected to ${dbType} database`);
        return this.connection;
    }
    async connectMySQL() {
        const pool = promise_1.default.createPool({
            host: config_1.config.database.mysql.host,
            port: config_1.config.database.mysql.port,
            user: config_1.config.database.mysql.user,
            password: config_1.config.database.mysql.password,
            database: config_1.config.database.mysql.database,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
        // Test connection
        await pool.getConnection();
        return {
            type: 'mysql',
            connection: pool,
            query: async (sql, params) => {
                const [rows] = await pool.execute(sql, params);
                return rows;
            },
            execute: async (sql, params) => {
                const [result] = await pool.execute(sql, params);
                return result;
            },
            close: async () => {
                await pool.end();
            }
        };
    }
    async connectPostgreSQL() {
        const pool = new pg_1.Pool({
            host: config_1.config.database.postgres.host,
            port: config_1.config.database.postgres.port,
            user: config_1.config.database.postgres.user,
            password: config_1.config.database.postgres.password,
            database: config_1.config.database.postgres.database,
            max: 10
        });
        // Test connection
        await pool.query('SELECT NOW()');
        return {
            type: 'postgres',
            connection: pool,
            query: async (sql, params) => {
                const result = await pool.query(sql, params);
                return result.rows;
            },
            execute: async (sql, params) => {
                const result = await pool.query(sql, params);
                return result;
            },
            close: async () => {
                await pool.end();
            }
        };
    }
    async connectSQLite() {
        const db = await new Promise((resolve, reject) => {
            const database = new sqlite3_1.default.Database(config_1.config.database.sqlite.path, (err) => {
                if (err)
                    reject(err);
                else
                    resolve(database);
            });
        });
        return {
            type: 'sqlite',
            connection: db,
            query: async (sql, params) => {
                return new Promise((resolve, reject) => {
                    db.all(sql, params || [], (err, rows) => {
                        if (err)
                            reject(err);
                        else
                            resolve(rows);
                    });
                });
            },
            execute: async (sql, params) => {
                return new Promise((resolve, reject) => {
                    db.run(sql, params || [], function (err) {
                        if (err)
                            reject(err);
                        else
                            resolve({ lastID: this.lastID, changes: this.changes });
                    });
                });
            },
            close: async () => {
                return new Promise((resolve, reject) => {
                    db.close((err) => {
                        if (err)
                            reject(err);
                        else
                            resolve();
                    });
                });
            }
        };
    }
    async connectMongoDB() {
        const client = new mongodb_1.MongoClient(config_1.config.database.mongodb.uri);
        await client.connect();
        const db = client.db();
        return {
            type: 'mongodb',
            connection: { client, db },
            query: async (collection, filter) => {
                return db.collection(collection).find(filter || {}).toArray();
            },
            execute: async (collection, _operation) => {
                // Operation should be an object like { insertOne: { document }, updateOne: { filter, update }, etc. }
                return db.collection(collection);
            },
            close: async () => {
                await client.close();
            }
        };
    }
    async connectCassandra() {
        const client = new cassandra_driver_1.Client({
            contactPoints: [config_1.config.database.cassandra.contactPoints],
            localDataCenter: config_1.config.database.cassandra.localDataCenter,
            keyspace: config_1.config.database.cassandra.keyspace
        });
        await client.connect();
        return {
            type: 'cassandra',
            connection: client,
            query: async (cql, params) => {
                const result = await client.execute(cql, params || [], { prepare: true });
                return result.rows;
            },
            execute: async (cql, params) => {
                return client.execute(cql, params || [], { prepare: true });
            },
            close: async () => {
                await client.shutdown();
            }
        };
    }
    getConnection() {
        if (!this.connection) {
            throw new Error('Database not connected. Call connect() first.');
        }
        return this.connection;
    }
    async disconnect() {
        if (this.connection) {
            await this.connection.close();
            this.connection = null;
            console.log('✅ Database disconnected');
        }
    }
}
exports.dbManager = DatabaseManager.getInstance();
const getDb = () => {
    return exports.dbManager.getConnection();
};
exports.getDb = getDb;
//# sourceMappingURL=database.js.map