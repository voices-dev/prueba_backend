// src/components/csv-processor/endpoints.js
const express = require('express');
const multer = require('multer');
const csvService = require('./src/csv-service');
const logger = require('../../helpers/logger');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Almacenar archivo en memoria

// WS1: Recibe CSV, valida números (10 dígitos) e inserta en BD. LENTO.
router.post('/upload-validate-save', upload.single('csvfile'), async (req, res, next) => {
  logger.info('Recibida petición para /upload-validate-save');
  if (!req.file) {
    return res.status(400).json({ message: 'No se proporcionó ningún archivo CSV.' });
  }

  try {
    const results = await csvService.processAndSaveCsv(req.file.buffer);
    logger.info(`WS1 Resultado: ${JSON.stringify(results)}`);
    if (results.errors.length > 0 && results.succeeded === 0) {
        return res.status(400).json({
            message: 'Procesamiento completado con errores. Ningún dato fue guardado.',
            details: results,
        });
    }
    res.status(200).json({
      message: 'Archivo CSV procesado (validar y guardar).',
      details: results,
    });
  } catch (error) {
    logger.error('Error en endpoint /upload-validate-save:', error);
    // Asegurarse de que el error se propague al manejador global si no es manejado aquí
    next(error);
  }
});

// WS2: Recibe CSV, valida si existen en BD, responde con CSV de no existentes. LENTO.
router.post('/check-missing', upload.single('csvfile'), async (req, res, next) => {
  logger.info('Recibida petición para /check-missing');
  if (!req.file) {
    return res.status(400).json({ message: 'No se proporcionó ningún archivo CSV.' });
  }

  try {
    const missingNumbersCsv = await csvService.findMissingNumbers(req.file.buffer);
    logger.info(`WS2: Se encontraron ${missingNumbersCsv.split('\n').length -1 } números faltantes (aprox).`);
    if (missingNumbersCsv === '' || missingNumbersCsv.split('\n').length <=1) {
        res.status(200).json({ message: 'Todos los números válidos del CSV ya existen en la base de datos o el archivo estaba vacío/inválido.'});
    } else {
        res.header('Content-Type', 'text/csv');
        res.attachment('missing_numbers.csv');
        res.status(200).send(missingNumbersCsv);
    }
  } catch (error) {
    logger.error('Error en endpoint /check-missing:', error);
    next(error);
  }
});

// WS3: Recibe CSV, valida los no existentes y los agrega a BD. LENTO.
router.post('/find-add-missing', upload.single('csvfile'), async (req, res, next) => {
  logger.info('Recibida petición para /find-add-missing');
  if (!req.file) {
    return res.status(400).json({ message: 'No se proporcionó ningún archivo CSV.' });
  }

  try {
    const results = await csvService.findAndAddMissingNumbers(req.file.buffer);
    logger.info(`WS3 Resultado: ${JSON.stringify(results)}`);
     if (results.errors.length > 0 && results.added === 0) {
        return res.status(400).json({
            message: 'Procesamiento completado con errores o no se agregaron nuevos números.',
            details: results,
        });
    }
    res.status(200).json({
      message: 'Archivo CSV procesado (buscar y agregar faltantes).',
      details: results,
    });
  } catch (error) {
    logger.error('Error en endpoint /find-add-missing:', error);
    next(error);
  }
});

// TODO: Endpoint para el desafío 4 (generar token)
// router.post('/auth/token', (req, res) => { ... });

module.exports = router;