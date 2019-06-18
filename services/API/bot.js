const isEmpty = require('lodash/isEmpty');
const logger = require('../logger');
const database = require('../database');

class Bot {
  constructor(ad = {}, getAds, APIConnection) {
    const { data } = ad;
    if (!data || !APIConnection) {
      logger.log('error', 'Error creating bot: no seed data.');
      throw new Error('No seed data.');
    }

    const { ad_id, price_equation } = data;
    if (!ad_id) {
      logger.log('error', 'Error creating bot: no seed data.');
      throw new Error('No seed data.');
    }
    logger.log('info', `Created bot for ad with id ${ad_id}.`);

    this.id = ad_id;
    this.price = price_equation;
    this.limit = 0;
    this.lastUpdated = Date.now();
    this.lastSuccess = false;
    this.paused = true;
    this.initialized = false;
    this.getAds = getAds;
    this.timeout = null;
    this.APIConnection = APIConnection;

    this.start = this.start.bind(this);
    this.pause = this.pause.bind(this);
    this.logic = this.logic.bind(this);
  }

  async start() {
    if (!this.initialized) {
      const savedData = await database.getAd(this.id);
      if (savedData && !isEmpty(savedData)) {
        const { limit } = savedData;
        this.limit = limit;
      }
    }
    this.paused = false;
    this.logic();
  }

  computeAds(ads) {
    const n = ads.length;
    if (n > 0) {
      let totalPrice = 0;
      let minPrice = 0;
      let maxPrice = 0;

      ads.forEach(post => {
        const { data } = post;
        if (data) {
          const { temp_price } = data;
          const price = Number(temp_price);

          totalPrice += price;
          if (price >= maxPrice) {
            maxPrice = price;
          }
          if (price <= minPrice || !minPrice) {
            minPrice = price;
          }
        }
      });

      logger.log('info', `Looked at ${n} local ads, with an average price of ${totalPrice / n} average price, ${minPrice} minimum price and ${maxPrice} max price.`);
      logger.log('info', `PRICE TO BEAT IS ${maxPrice}.`);
      return maxPrice;
    }
    return null;
  } 

  async logic() {
    if (!this.paused) {
      try {
        const localAds = this.getAds();
        const priceToBeat = this.computeAds(localAds);
        if (priceToBeat > this.price && priceToBeat < this.limit) {
          await this.updatePrice(priceToBeat);
        }

        this.lastSuccess = true;
        this.lastUpdated = Date.now();
        this.timeout = setTimeout(this.logic, 1000);
      } catch ({ message }) {
        this.lastSuccess = false;
        this.lastUpdated = Date.now();
        logger.log('error', `Error updating bot logic for ad ${this.id}: ${message}.`);
        this.timeout = setTimeout(this.logic, 10000);
      }
    }
  }

  pause() {
    this.timeout = null;
    this.paused = true;
  }
}

module.exports = Bot;