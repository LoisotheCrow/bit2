const config = require('config');
const isEmpty = require('lodash/isEmpty');
const logger = require('../logger');
const APIBot = require('./bot');
const LBAPI = require('./LBAPI');

class API {
  constructor() {
    const APIConfig = config.get('LBAPI');
    if (!APIConfig) {
      throw new Error('Could not initialize API: no seed data.');
    }
    
    try {
      this.bots = [];
      this.localAds = [];
      this.APIConnection = new LBAPI(APIConfig);
      this.initialized = false;
  
      this.createBots = this.createBots.bind(this);
      this.getAds = this.getAds.bind(this);
      this.updateLocalAds = this.updateLocalAds.bind(this);

      this.createBots();
    } catch ({ message }) {
      logger.log('error', `Error initializing API service: ${message}.`);
      throw new Error('Could not inititalize API.');
    }
    
    logger.log('info', 'Initialized API service.');
  }

  async createBots() {
    logger.log('info', 'Preparing to initialize bots.');
    try {
      const ads = await this.APIConnection.getAds();
      ads.forEach(ad => {
        this.bots.push(new APIBot(ad, this.getAds, this.APIConnection))
      });
      this.initialized = true;
      this.updateLocalAds();
    } catch ({ message }) {
      logger.log('error', `Error while initializing bots: ${message}.`);
      setTimeout(this.createBots, 10000);
    }
  }

  getAds() {
    return this.localAds;
  }

  async updateLocalAds() {
    try {
      const localAds = await this.APIConnection.getLocalAds();
      if (localAds && !isEmpty(localAds)) {
        this.localAds = localAds;
      }
      setTimeout(this.updateLocalAds, 1000);
    } catch ({ message }) {
      logger.log('error', `Error while updating local ads: ${message}.`);
    }
  }
}

module.exports = new API();