'use strict';

/**
 * Get the Room credentials from the server.
 * @returns {Promise<{identity: string, token: string}>}
 */
function getRoomCredentials() {
  return new Promise(function(resolve) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/token', true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      }
    };
    xhr.send(null);
  });
}

module.exports = getRoomCredentials;
