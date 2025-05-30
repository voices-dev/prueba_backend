// src/components/csv-processor/modules/csv-data.js
const { getConnection } = require('../bdd/mariadb-connector');
const logger = require('../../../helpers/logger');

// INTENCIONALMENTE LENTO: Inserta uno por uno y crea una nueva conexión cada vez.
async function saveNumber(number) {
  let connection;
  try {
    connection = await getConnection(); // Abre nueva conexión
    // Simulación de lentitud adicional
    await new Promise(resolve => setTimeout(resolve, 50)); // 50ms de delay artificial
    const [result] = await connection.execute(
      'INSERT INTO validated_numbers (number) VALUES (?)',
      [number]
    );
    // logger.info(`Número ${number} insertado. ID: ${result.insertId}`); // Demasiado verboso para la prueba
    return result.insertId;
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      // logger.warn(`Número ${number} ya existe.`); // Puede ser útil
      return null; // O manejar como se requiera
    }
    logger.error(`Error al guardar el número ${number}:`, error);
    throw error;
  } finally {
    if (connection) {
      // logger.debug('Cerrando conexión después de saveNumber'); // Comentado
      // await connection.end(); // NO CERRAMOS LA CONEXIÓN A PROPÓSITO PARA LA PRUEBA
    }
  }
}

// INTENCIONALMENTE LENTO: Verifica uno por uno y crea una nueva conexión cada vez.
async function checkNumberExists(number) {
  let connection;
  try {
    connection = await getConnection(); // Abre nueva conexión
    // Simulación de lentitud adicional
    await new Promise(resolve => setTimeout(resolve, 20)); // 20ms de delay artificial
    const [rows] = await connection.execute(
      'SELECT 1 FROM validated_numbers WHERE number = ? LIMIT 1',
      [number]
    );
    return rows.length > 0;
  } catch (error) {
    logger.error(`Error al verificar el número ${number}:`, error);
    throw error;
  } finally {
    if (connection) {
      // logger.debug('Cerrando conexión después de checkNumberExists'); // Comentado
      // await connection.end(); // NO CERRAMOS LA CONEXIÓN A PROPÓSITO PARA LA PRUEBA
    }
  }
}

module.exports = {
  saveNumber,
  checkNumberExists,
};