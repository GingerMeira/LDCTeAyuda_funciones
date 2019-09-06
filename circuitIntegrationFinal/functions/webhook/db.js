/**
 * Authenticates the Bot and returns the Access Token
 */

'use strict';

const Datastore = require('@google-cloud/datastore');

// Instantiates a data store client
const datastore = Datastore();
let ns, domain;

function init(url) {
  domain = url;
  ns = 'ldcTeAyuda_' + url.split('//')[1];
}

async function saveToken(userId, token) {
  // Use the domain (e.g. https://circuitsandbox.net) as key
  const key = datastore.key({
    namespace: ns,
    path: ['token', domain]
  });
  const entity = {
    key: key,
    data: { domain, userId, token }
  }

  await datastore.upsert(entity);
  console.log(`Token for domain ${domain} added to Datastore`);
}

async function getToken() {
  const key = datastore.key({
    namespace: ns,
    path: ['token', domain]
  });
  const entity = await datastore.get(key);
  return entity[0];
}

module.exports = {
  init,  
  saveToken,
  getToken,

}