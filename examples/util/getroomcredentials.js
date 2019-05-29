'use strict';

/**
 * Get the Room credentials from the server.
 * @param {string} [identity] identitiy to use, if not specified server generates random one.
 * @returns {Promise<{identity: string, token: string}>}
 */
async function getRoomCredentials(identity) {
  const tokenUrl = '/token' + (identity ? '?identity=' + identity : '');
  const response = await fetch(tokenUrl);
  return response.json();
}

module.exports = getRoomCredentials;
