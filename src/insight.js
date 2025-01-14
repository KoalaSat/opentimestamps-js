'use strict';

/**
 * Insight module.
 * @module Insight
 * @author EternityWall
 * @license LPGL3
 */

const axios = require('axios');
const Promise = require('promise');
const Utils = require('./utils.js');

/** Class used to query Insight API */
class Insight {

  /**
   * Create a RemoteCalendar.
   */
  constructor(url) {
    this.urlBlockindex = url + '/block-index';
    this.urlBlock = url + '/block';

    // this.urlBlockindex = 'https://search.bitaccess.co/insight-api/block-index';
    // this.urlBlock = 'https://search.bitaccess.co/insight-api/block';
    // this.urlBlock = "https://insight.bitpay.com/api/block-index/447669";
  }

  /**
   * This callback is called when the result is loaded.
   *
   * @callback resolve
   * @param {Timestamp} timestamp - The timestamp of the Calendar response.
   */

  /**
   * This callback is called when the result fails to load.
   *
   * @callback reject
   * @param {Error} error - The error that occurred while loading the result.
   */

  /**
   * Retrieve the block hash from the block height.
   * @param {string} height - Height of the block.
   * @returns {Promise} A promise that returns {@link resolve} if resolved
   * and {@link reject} if rejected.
   */
  blockhash(height) {
    const options = {
      url: this.urlBlockindex + '/' + height,
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'javascript-opentimestamps',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      json: true
    };

    return new Promise((resolve, reject) => {
      axios.get(this.urlBlockindex + '/' + height, { 
        headers: {
          Accept: 'application/json',
          'User-Agent': 'javascript-opentimestamps',
          'Content-Type': 'application/x-www-form-urlencoded'
        } 
      })
      .then(response => {
        console.log(this.urlBlockindex + '/' + height, response.data);
        if (response.data.lenght === 0) {
          console.error('Insight response error body ');
          reject();
          return;
        }

        resolve(response.data.blockHash);
      })
      .catch(err => {
        console.error('Insight response error: ' + err);
        reject();
      });
    });
  }

  /**
   * Retrieve the block information from the block hash.
   * @param {string} height - Height of the block.
   * @returns {Promise} A promise that returns {@link resolve} if resolved
   * and {@link reject} if rejected.
   */
  block(hash) {
    const options = {
      url: this.urlBlock + '/' + hash,
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'javascript-opentimestamps',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      json: true
    };

    return new Promise((resolve, reject) => {
      axios.get(this.urlBlock + '/' + hash, { 
        headers: {
          Accept: 'application/json',
          'User-Agent': 'javascript-opentimestamps',
          'Content-Type': 'application/x-www-form-urlencoded'
        } 
      })
      .then(response => {
        console.log(this.urlBlock + '/' + hash, response.data);
        if (response.data.lenght === 0) {
          console.error('Insight response error body ');
          reject();
          return;
        }
        resolve({merkleroot: response.data.merkleroot, time: response.data.time});
      })
      .catch(err => {
        console.error('Insight response error: ' + err);
        reject();
      });
    });
  }
}

// const urls = ['https://notexisting.it', 'https://search.bitaccess.co/insight-api', 'https://search.bitaccess.co/insight-api', 'https://insight.bitpay.com/api'];
// const urls = ['https://www.localbitcoinschain.com/api', 'https://search.bitaccess.co/insight-api', 'https://insight.bitpay.com/api', 'https://ots.eternitywall.it/insight-api'];
// const urls = ['https://test-insight.bitpay.com/api', 'https://test-insight.bitpay.com/api'];

class MultiInsight {

  constructor(urls) {
    this.insights = [];
    console.log('[OTS] -- Using Insight: ' + urls);
    urls.forEach(url => {
      this.insights.push(new Insight(url));
    });
  }

  blockhash(height) {
    const res = [];
    this.insights.forEach(insight => {
      res.push(insight.blockhash(height));
    });
    return new Promise((resolve, reject) => {
      Promise.all(res.map(Utils.softFail)).then(results => {
        // console.log('results=' + results);
        const set = new Set();
        let found = false;
        results.forEach(result => {
          if (result !== undefined && !found) {
            if (set.has(result)) {
              // return if two results are equal
              resolve(result);
              found = true;
            }
            set.add(result);
          }
        });
        if (!found) {
          reject();
        }
      });
    });
  }

  block(hash) {
    const res = [];
    this.insights.forEach(insight => {
      res.push(insight.block(hash));
    });
    return new Promise((resolve, reject) => {
      Promise.all(res.map(Utils.softFail)).then(results => {
        // console.log('results=' + results);
        const resultSet = new Set();
        let found = false;
        results.forEach(result => {
          if (result !== undefined && !found) {
            if (resultSet.has(JSON.stringify(result))) {
              // return if two results are equal
              resolve(result);
              found = true;
            }
            resultSet.add(JSON.stringify(result));
          }
        });
        if (!found) {
          reject();
        }
      });
    });
  }

}

module.exports = {
  Insight,
  MultiInsight
};
