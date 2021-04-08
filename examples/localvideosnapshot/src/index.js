'use strict';

var Prism = require('prismjs');
var getSnippet = require('../../util/getsnippet');
var helpers = require('./helpers');
var displayLocalVideo = helpers.displayLocalVideo;
var takeLocalVideoSnapshot = helpers.takeLocalVideoSnapshot;

var canvas = document.querySelector('.snapshot-canvas');
var img = document.querySelector('.snapshot-img');
var takeSnapshot = document.querySelector('button#takesnapshot');
var video = document.querySelector('video#videoinputpreview');

let videoTrack;
let el;

// Show image or canvas
window.onload = function() {
  el = window.ImageCapture ? img : canvas;
  el.classList.remove('hidden');
  if(videoTrack) {
    setSnapshotSizeToVideo(el, videoTrack);
  }
}

// Set the canvas size to the video size.
function setSnapshotSizeToVideo(snapshot, video) {
  snapshot.width = video.dimensions.width;
  snapshot.height = video.dimensions.height;
}

// Load the code snippet.
getSnippet('./helpers.js').then(function(snippet) {
  var pre = document.querySelector('pre.language-javascript');
  pre.innerHTML = Prism.highlight(snippet, Prism.languages.javascript);
});

// Request the default LocalVideoTrack and display it.
displayLocalVideo(video).then(function(localVideoTrack) {
  // Display a snapshot of the LocalVideoTrack on the canvas.
  videoTrack = localVideoTrack;
  takeSnapshot.onclick = function() {
    setSnapshotSizeToVideo(el, localVideoTrack);
    takeLocalVideoSnapshot(video, localVideoTrack, el);
  };
});

// Resize the canvas to the video size whenever window is resized.
window.onresize = function() {
  setSnapshotSizeToVideo(el, videoTrack);
};
