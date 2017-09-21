'use strict';

/**
 * Get the Room credentials from the server.
 * @returns {Promise<{identity: string, token: string}>}
 */
async function getRoomCredentials() {
  const response = await fetch('/token');
  return response.json();
}

module.exports = getRoomCredentials;
