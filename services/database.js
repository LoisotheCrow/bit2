const { Datastore } = require('@google-cloud/datastore');
const config = require('config');
const logger = require('./logger');

class Database {
  constructor() {
    const { projectId } = config.get('gcloud');
    if (!projectId) {
      logger.log('error', 'Error creating database: no seed data.');
      throw new Error('No seed data: database.');
    }

    try {
      this.datastore = new Datastore({ projectId });
    } catch ({ message }) {
      logger.log('error', `Error creating database: ${message}.`);
      throw new Error(`Error creating database: ${message}.`);
    }
  }

  async saveAd(data) {
    const kind = 'Ad';
    const name = data.ad_id;
    const key = this.datastore.key([kind, name]);
    const ad = { key, data };
    await this.datastore.save(ad);
  }

  async getAd(id) {
    return await this.datastore.createQuery().filter('ad_id', '=', key);
  }
}

module.exports = new Database();