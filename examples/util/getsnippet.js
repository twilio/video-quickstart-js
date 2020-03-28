'use strict';

/**
 * Get the code snippet from a file.
 * @param {string} relativePath
 * @returns {Promise<string>}
 */
async function getSnippet(relativePath) {
  const response = await fetch(relativePath);
  return response.text();
}

module.exports = getSnippet;
