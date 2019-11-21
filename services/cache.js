const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');
const keys = require("../config/keys");

const client = redis.createClient(keys.redisUrl);
client.hget = util.promisify(client.hget);

const exec = mongoose.Query.prototype.exec;


mongoose.Query.prototype.cache = function(options = {}) {
  this.useCache = true;
  this.hashKey = JSON.stringify(options.key || '');
  return this;
}

// taking the exec function on the Query object and monkey patching the functionality
mongoose.Query.prototype.exec = async function() {
  if (this.useCache) {
    const collectionName = this.mongooseCollection.name
    const key = JSON.stringify({...this.getQuery(), collection: collectionName});
    // see if we have a value for 'key' in redis
    const hashKey = this.hashKey || collectionName;
    const cacheValue = await client.hget(hashKey, key);
    // if we do, return that
    if (cacheValue) {
      const doc = JSON.parse(cacheValue);
      const mappedDoc = Array.isArray(doc) 
      ? doc.map(val => new this.model(val))
      : new this.model(doc);
      return mappedDoc;
    }
    // otherwise, issue query and store result in redis
    // running exec is equivalent to actually issuing the query
    try{
      const result = await exec.apply(this, arguments); //returns a mongoose document
      client.hset(hashKey, key, JSON.stringify(result), 'EX', 10);
      return result;
    }
    catch{
      console.log('there was an error in query.exec')
    }
  }
  else return exec.apply(this, arguments);
}

module.exports = {
  clearHash(hashKey) {
    client.del(JSON.stringify(hashKey));
  }
}