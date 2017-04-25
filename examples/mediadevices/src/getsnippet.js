'use strict';

var SDK_VERSION = require('../../../package.json')
  .dependencies['twilio-video'].replace(/\^/, '');

var SDK_DOCS_LINK = '//media.twiliocdn.com/sdk/js/video/releases/'
  + SDK_VERSION + '/docs/';

/**
 * Get JSDoc link for a class.
 * @param {string} name - Name of the class
 * @returns {string} - JSDoc link for the class
 */
function getClassDocsLink(name) {
  return SDK_DOCS_LINK + name + '.html';
}

/**
 * Get JSDoc link for a global.
 * @param {string} name - Name of the global
 * @returns {string} - JSDoc link for the global
 */
function getGlobalDocsLink(name) {
  return SDK_DOCS_LINK + 'global.html#' + name;
}

/**
 * Get the code snippet from a file.
 * @param {string} relativePath
 * @param {function(string): string} highlight
 * @returns {Promise<string>}
 */
function getSnippet(relativePath, highlight) {
  return fetch(relativePath).then(function(response) {
    return response.text();
  }).then(function(snippet) {
    return [
      [ 'createLocalAudioTrack', getGlobalDocsLink ],
      [ 'createLocalVideoTrack', getGlobalDocsLink ],
      [ 'LocalAudioTrack', getClassDocsLink ],
      [ 'LocalVideoTrack', getClassDocsLink ]
    ].reduce(function(snippetHtml, nameDocsLinkPair) {
      var name = nameDocsLinkPair[0];
      var getDocsLink = nameDocsLinkPair[1];
      var anchor = '<a href="' + getDocsLink(name) + '" target="_blank">' + name + '</a>';
      return snippetHtml.replace(new RegExp('__' + name + '__', 'g'), anchor);
    }, highlight(snippet));
  });
}

module.exports = getSnippet;
