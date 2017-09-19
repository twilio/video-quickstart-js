'use strict';

/**
 * Get the Room credentials from the server.
 * @returns {Promise<{identity: string, token: string}>}
 */
function getRoomCredentials() {
  return fetch('/token').then(function(response) {
    return response.json();
  });
}

module.exports = getRoomCredentials;
