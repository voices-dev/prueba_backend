// src/components/csv-processor/bdd/mariadb-connector.js
const mysql = require('mysql2/promise');
const logger = require('../../../helpers/logger');

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'testuser',
  password: process.env.DB_PASSWORD || 'testpassword',
  database: process.env.DB_NAME || 'testdb',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10, // Límite de pool, MariaDB en sí tendrá otro límite
  queueLimit: 0
}; 

// Intentionally NOT creating a pool here for the test requirements.
// Each operation will create a new connection.
// This is BAD practice and is done on purpose for the technical test.

async function getConnection() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    // logger.info('Nueva conexión a MariaDB establecida.'); // Comentado para no saturar logs
    return connection;
  } catch (error) {
    logger.error('Error al conectar con MariaDB:', error);
    throw error;
  }
}

// Función para crear la tabla si no existe
async function initializeDatabase() {
  let connection;
  try {
    connection = await getConnection();
    await connection.query(`
      CREATE TABLE IF NOT EXISTS validated_numbers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        number VARCHAR(10) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info("Tabla 'validated_numbers' verificada/creada.");
  } catch (error) {
    console.error("Error al inicializar la base de datos:", error);
    logger.error("Error inicializando la tabla 'validated_numbers':", error);
    throw error;
  } finally {
    if (connection) {
      // logger.info('Cerrando conexión de inicialización.'); // Comentado
      await connection.end(); // Cerrar esta conexión específica
    }
  }
}

module.exports = {
  getConnection,
  initializeDatabase
};