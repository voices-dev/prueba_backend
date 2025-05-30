// index.js
require('dotenv').config();
const express = require('express');
// const pino = require('pino'); // Ya no es necesario importar pino directamente aquí
const pinoHttp = require('pino-http'); // Importar pino-http
const logger = require('./src/helpers/logger'); // Nuestra instancia de logger configurada
const csvProcessorEndpoints = require('./src/components/csv-processor/endpoints');
const { initializeDatabase } = require('./src/components/csv-processor/bdd/mariadb-connector');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());

// Configurar pino-http para el logueo de peticiones HTTP
// Usará la instancia de `logger` que ya tiene pino-pretty configurado.
const httpRequestLogger = pinoHttp({
  logger: logger,
  // Puedes añadir personalizaciones específicas de pino-http aquí si es necesario
  // Por ejemplo, para cambiar el formato del mensaje de log:
  // customSuccessMessage: function (req, res) {
  //   if (res.statusCode === 404) {
  //     return `${req.method} ${req.url} not found`;
  //   }
  //   return `${req.method} ${req.url} completed ${res.statusCode}`;
  // },
  // customErrorMessage: function (req, res, err) {
  //   return `Error on ${req.method} ${req.url} with error: ${err.message}`;
  // }
});
app.use(httpRequestLogger); // Usar el middleware de pino-http

// Database Initialization
initializeDatabase()
  .then(() => {
    logger.info('Base de datos inicializada (o ya existe).');
  })
  .catch(error => {
    logger.error('Error al inicializar la base de datos:', error);
    process.exit(1); // Salir si la BD no se puede inicializar
  });


// Rutas del componente CSV Processor
app.use('/api/csv', csvProcessorEndpoints);

// Global error handler (simple)
app.use((err, req, res, next) => {
  logger.error(err.stack); // El logger ya está disponible y configurado
  res.status(500).send('Algo salió mal!');
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Considera un cierre más elegante aquí en producción
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Considera un cierre más elegante aquí en producción
  process.exit(1);
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`Servidor escuchando en http://localhost:${PORT}`);
  });
}

module.exports = app; // Exportar para pruebas