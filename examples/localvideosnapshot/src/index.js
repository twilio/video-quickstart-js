'use strict';

var Prism = require('prismjs');
var getSnippet = require('../../util/getsnippet');
var helpers = require('./helpers');
var displayLocalVideo = helpers.displayLocalVideo;
var takeLocalVideoSnapshot = helpers.takeLocalVideoSnapshot;

var canvas = document.querySelector('canvas#snapshot');
var takeSnapshot = document.querySelector('button#takesnapshot');
var video = document.querySelector('video#videoinputpreview');

// Set the canvas size to the video size.
function setCanvasSizeToVideo(canvas, video) {
  canvas.style.height = video.clientHeight + 'px';
}

// Load the code snippet.
getSnippet('./helpers.js').then(function(snippet) {
  var pre = document.querySelector('pre.language-javascript');
  pre.innerHTML = Prism.highlight(snippet, Prism.languages.javascript);
});

// Request the default LocalVideoTrack and display it.
displayLocalVideo(video).then(function() {
  // Display a snapshot of the LocalVideoTrack on the canvas.
  takeSnapshot.onclick = function() {
    setCanvasSizeToVideo(canvas, video);
    takeLocalVideoSnapshot(video, canvas);
  };
});

// Resize the canvas to the video size whenever window is resized.
window.onresize = function() {
  setCanvasSizeToVideo(canvas, video);
};
