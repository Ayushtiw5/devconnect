const app = require('./app');
const config = require('./config');
const connectDB = require('./config/db');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Connect to database
connectDB();

// Start server
const server = app.listen(config.port, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║           DevConnect API Server                       ║
╠═══════════════════════════════════════════════════════╣
║  Environment: ${config.env.padEnd(40)}║
║  Port:        ${String(config.port).padEnd(40)}║
║  API URL:     http://localhost:${config.port}/api/v1${' '.repeat(18)}║
╚═══════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Graceful shutdown on SIGTERM
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated.');
  });
});

module.exports = server;
