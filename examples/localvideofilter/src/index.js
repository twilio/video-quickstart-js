'use strict';

var Prism = require('prismjs');
var getSnippet = require('../../util/getsnippet');
var helpers = require('./helpers');
var displayLocalVideo = helpers.displayLocalVideo;
var filterLocalVideo = helpers.filterLocalVideo;

var selectFilter = document.querySelector('select#filter');
var video = document.querySelector('video#videoinputpreview');
var filtered = document.querySelector('video#videoinputfiltered');

// Load the code snippet.
getSnippet('./helpers.js').then(function(snippet) {
  var pre = document.querySelector('pre.language-javascript');
  pre.innerHTML = Prism.highlight(snippet, Prism.languages.javascript);
});

// Request the default LocalVideoTrack and display it.
displayLocalVideo(video).then(function() {
  // Apply the selected filter to the local video.
  filterLocalVideo(video, filtered, selectFilter.value);
  selectFilter.onchange = function() {
    filterLocalVideo(video, filtered, selectFilter.value);
  };
});
