'use strict';

/**
 * Get the code snippet from a file.
 * @param {string} relativePath
 * @returns {Promise<string>}
 */
function getSnippet(relativePath) {
  return new Promise(function(resolve) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', relativePath, true);
    xhr.onreadystatechange = function() {
      if (xhr.status === 200 && xhr.readyState === 4) {
        resolve(xhr.responseText);
      }
    };
    xhr.send(null);
  });
}

module.exports = getSnippet;