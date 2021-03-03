'use strict';

var Video = require('twilio-video');
var filters = require('./filters');

/**
 * Display local video in the given HTMLVideoElement.
 * @param {HTMLVideoElement} video
 * @returns {Promise<void>}
 */
function displayLocalVideo(video) {
  return Video.createLocalVideoTrack({
    width: 640,
    height: 360
  }).then(function(localTrack) {
    localTrack.attach(video);
  });
}

/**
 * The timeout for filtering a video frame.
 * @type {number}
 */
var filterTimeout;

/**
 * Apply the specified filter to the local video.
 * @param {HTMLVideoElement} video - Raw video
 * @param {HTMLVideoElement} filtered - Filtered video
 * @param {'none' | 'blur' | 'grayscale' | 'sepia'} name - Filter name
 */
function filterLocalVideo(video, filtered, name) {
  var canvas = document.createElement('canvas');
  var mediaStreamTrack = video.srcObject.getVideoTracks()[0];
  var settings = mediaStreamTrack.getSettings();
  canvas.width = settings.width;
  canvas.height = settings.height;

  var context = canvas.getContext('2d');
  var filterValue = name === 'blur' ? '5px' : '100%';
  context.filter = name === 'none' ? '' : name + '(' + filterValue + ')';
  clearTimeout(filterTimeout);

  var isSafari = /Safari/.test(navigator.userAgent)
    && !/Chrome/.test(navigator.userAgent);

  function filterVideoFrame() {
    var renderStartTime = Date.now();
    context.drawImage(video, 0, 0);
    if (isSafari) {
      var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      context.putImageData(filters[name](imageData), 0, 0);
    }
    var renderDelay = Date.now() - renderStartTime;
    var interFrameDelay = Math.round(1000 / settings.frameRate);
    filterTimeout = setTimeout(filterVideoFrame, interFrameDelay - renderDelay);
  }

  var stream = canvas.captureStream(settings.frameRate);
  filtered.srcObject = stream;
  filterTimeout = setTimeout(filterVideoFrame);
}

module.exports.displayLocalVideo = displayLocalVideo;
module.exports.filterLocalVideo = filterLocalVideo;
