const dotenv = require('dotenv');
dotenv.config();

const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 3001,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/productos',
  JWT_SECRET: process.env.JWT_SECRET || 'change-this-in-prod',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  MONGO_OPTIONS: {
    serverSelectionTimeoutMS: parseInt(process.env.MONGO_TIMEOUT_MS, 10) || 8000,
  },
};

module.exports = config;