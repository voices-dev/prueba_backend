// src/components/csv-processor/src/csv-service.js
const csv = require('csv-parser');
const { Readable } = require('stream');
const { saveNumber, checkNumberExists } = require('../modules/csv-data');
const logger = require('../../../helpers/logger');

const TEN_DIGITS_REGEX = /^\d{10}$/;

/**
 * Valida si una cadena es un número de 10 dígitos.
 * @param {string} numberString - La cadena a validar.
 * @returns {boolean}
 */
function isValidNumber(numberString) {
  return TEN_DIGITS_REGEX.test(numberString);
}

/**
 * WS1: Procesa un CSV, valida números y los guarda en la BD.
 * INTENCIONALMENTE LENTO.
 * @param {Buffer} csvBuffer - El buffer del archivo CSV.
 * @returns {Promise<{processed: number, Succeeded: number, failed: number, errors: string[]}>}
 */
async function processAndSaveCsv(csvBuffer) {
  return new Promise((resolve, reject) => {
    const results = { processed: 0, succeeded: 0, failed: 0, errors: [] };
    const stream = Readable.from(csvBuffer.toString());

    stream
      .pipe(csv({ headers: ['number'], skipLines: 0 })) // Asume una columna 'number' o la primera columna
      .on('data', async (row) => {
        // Pausar el stream para procesar cada fila de forma asíncrona (y lenta)
        stream.pause();
        results.processed++;
        const numberToValidate = row.number || Object.values(row)[0]; // Tomar 'number' o la primera columna

        if (isValidNumber(numberToValidate)) {
          try {
            await saveNumber(numberToValidate);
            results.succeeded++;
          } catch (error) {
            results.failed++;
            const errorMessage = `Error guardando ${numberToValidate}: ${error.message}`;
            logger.error(errorMessage);
            results.errors.push(errorMessage);
          }
        } else {
          results.failed++;
          const errorMessage = `Número inválido: ${numberToValidate}`;
          logger.warn(errorMessage);
          results.errors.push(errorMessage);
        }
        // Reanudar el stream para la siguiente fila
        stream.resume();
      })
      .on('end', () => {
        logger.info('Procesamiento CSV (guardar) finalizado.');
        resolve(results);
      })
      .on('error', (error) => {
        logger.error('Error en el stream CSV (guardar):', error);
        reject(error);
      });
  });
}

/**
 * WS2: Recibe un CSV, verifica qué números no existen en la BD y devuelve un CSV con ellos.
 * INTENCIONALMENTE LENTO.
 * @param {Buffer} csvBuffer - El buffer del archivo CSV de entrada.
 * @returns {Promise<string>} - Una cadena CSV con los números no encontrados.
 */
async function findMissingNumbers(csvBuffer) {
  return new Promise((resolve, reject) => {
    const missingNumbers = [];
    const stream = Readable.from(csvBuffer.toString());

    stream
      .pipe(csv({ headers: ['number'], skipLines: 0 }))
      .on('data', async (row) => {
        stream.pause();
        const numberToCheck = row.number || Object.values(row)[0];

        if (isValidNumber(numberToCheck)) {
          try {
            const exists = await checkNumberExists(numberToCheck);
            if (!exists) {
              missingNumbers.push(numberToCheck);
            }
          } catch (error) {
            logger.error(`Error verificando ${numberToCheck} para WS2: ${error.message}`);
            // Decidir si agregar a una lista de errores o ignorar para la salida
          }
        } else {
          logger.warn(`Número inválido en CSV para WS2: ${numberToCheck}`);
        }
        stream.resume();
      })
      .on('end', () => {
        logger.info('Procesamiento CSV (buscar faltantes) finalizado.');
        // Construir CSV de salida
        if (missingNumbers.length === 0) {
          resolve(''); // o 'number\n' si se prefiere un CSV con solo encabezado
          return;
        }
        const outputCsv = `number\n${missingNumbers.join('\n')}`;
        resolve(outputCsv);
      })
      .on('error', (error) => {
        logger.error('Error en el stream CSV (buscar faltantes):', error);
        reject(error);
      });
  });
}

/**
 * WS3: Recibe un CSV, valida los números que no existen y los agrega a la BD.
 * INTENCIONALMENTE LENTO.
 * @param {Buffer} csvBuffer - El buffer del archivo CSV.
 * @returns {Promise<{processed: number, added: number, existingOrInvalid: number, errors: string[]}>}
 */
async function findAndAddMissingNumbers(csvBuffer) {
  return new Promise((resolve, reject) => {
    const results = { processed: 0, added: 0, existingOrInvalid: 0, errors: [] };
    const stream = Readable.from(csvBuffer.toString());

    stream
      .pipe(csv({ headers: ['number'], skipLines: 0 }))
      .on('data', async (row) => {
        stream.pause();
        results.processed++;
        const numberToProcess = row.number || Object.values(row)[0];

        if (isValidNumber(numberToProcess)) {
          try {
            const exists = await checkNumberExists(numberToProcess);
            if (!exists) {
              await saveNumber(numberToProcess);
              results.added++;
            } else {
              results.existingOrInvalid++;
            }
          } catch (error) {
            results.existingOrInvalid++; // Contar como no agregado
            const errorMessage = `Error procesando/guardando ${numberToProcess} para WS3: ${error.message}`;
            logger.error(errorMessage);
            results.errors.push(errorMessage);
          }
        } else {
          results.existingOrInvalid++;
          const errorMessage = `Número inválido en CSV para WS3: ${numberToProcess}`;
          logger.warn(errorMessage);
          results.errors.push(errorMessage);
        }
        stream.resume();
      })
      .on('end', () => {
        logger.info('Procesamiento CSV (buscar y agregar) finalizado.');
        resolve(results);
      })
      .on('error', (error) => {
        logger.error('Error en el stream CSV (buscar y agregar):', error);
        reject(error);
      });
  });
}


module.exports = {
  processAndSaveCsv,
  findMissingNumbers,
  findAndAddMissingNumbers,
};