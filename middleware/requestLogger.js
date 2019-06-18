const isEmpty = require('lodash/isEmpty');
const uuid = require('uuid');
const logger = require('../services/logger');
const API = require('../services/API');

const requestLogger = async (req, res, next) => {
  const { url, data, headers } = req;
  const requestId = uuid();
  
  logger.log('info', '------------> NEXT ------------>');
  logger.log('info', `Got request on ${url} with id ${requestId}.`);
  if (data && !isEmpty(data)) {
    logger.log('info', `Request data: ${JSON.stringify(data)}`);
  }
  logger.log('info', `Request headers: ${JSON.stringify(headers)}`);
  
  try {
    if (API.initialized) {
      await next();
      logger.log('info', `Successfully handled request ${requestId}.`)
    } else {
      logger.log('warn', 'API not ready.');
      res.status(503).send('Service is unavailable.');
    }
  } catch ({ message }) {
    logger.log('error', `Error while handling request ${requestId}: ${message}.`)
  }

  logger.log('info', '--------------------------------');
}

module.exports = requestLogger;