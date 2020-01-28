'use strict';


const Prism = require('prismjs');
var getSnippet = require('../../util/getsnippet');
const Video = require('twilio-video');
const getRoomCredentials = require('../../util/getroomcredentials');
const helpers = require('./helpers');


var video = document.querySelector('video#videoinputpreview');

// Load the code snippet.
getSnippet('./helpers.js').then(function(snippet) {
  var pre = document.querySelector('pre.language-javascript');
  pre.innerHTML = Prism.highlight(snippet, Prism.languages.javascript);
});

