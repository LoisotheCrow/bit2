const API = require('../../services/API');
const logger = require('../../services/logger');

const getBots = async (req, res) => {
  try {
    const bots = API.bots.map(bot => ({
      id: bot.id,
      limit: bot.limit,
      paused: bot.paused,
      lastUpdated: bot.lastUpdated,
    }));
    res.status(200).json(bots);
  } catch ({ message }) {
    logger.log('error', `Failed to get bots by request: ${message}.`);
    res.status(500).send('Unexpected service error.');
  }
};

module.exports = getBots;
