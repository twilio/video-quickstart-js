'use strict';

var Video = require('twilio-video');

/**
 * Apply a filter to the frames of a LocalVideoTrack.
 * @param {number} width - Width in pixels of the video frames
 * @param {number} height - Height in pixels of the video frames
 * @param {string} filterCSS - Filter CSS string
 * @constructor
 */
function FilterVideoProcessor(width, height, filterCSS) {
  this._outputFrame = new OffscreenCanvas(width, height);
  this._outputContext = this._outputFrame.getContext('2d');
  this._outputContext.filter = filterCSS;
}

/**
 * Process a frame of the LocalVideoTrack.
 * @param {OffscreenCanvas} inputFrame
 * @returns {OffscreenCanvas}
 */
FilterVideoProcessor.prototype.processFrame = function processFrame(inputFrame) {
  this._outputContext.drawImage(inputFrame, 0, 0);
  return this._outputFrame;
};

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
 * The filtered LocalVideoTrack;
 */
var filteredLocalTrack;

/**
 * Apply the specified filter to the local video.
 * @param {HTMLVideoElement} video - Raw video
 * @param {HTMLVideoElement} filtered - Filtered video
 * @param {'none' | 'blur' | 'grayscale' | 'sepia'} name - Filter name
 */
function filterLocalVideo(video, filtered, name) {
  if (!filteredLocalTrack) {
    var mediaStreamTrack = video.srcObject.getVideoTracks()[0];
    filteredLocalTrack = new Video.LocalVideoTrack(mediaStreamTrack);
    filteredLocalTrack.attach(filtered);
  }

  var processor = filteredLocalTrack.processor;
  if (processor) {
    filteredLocalTrack.removeProcessor(processor);
  }

  if (name !== 'none') {
    var filterCSS = name + '(' + (name === 'blur' ? '5px' : '100%') + ')';
    var settings = filteredLocalTrack.mediaStreamTrack.getSettings();
    var height = settings.height;
    var width = settings.width;
    processor = new FilterVideoProcessor(width, height, filterCSS);
    filteredLocalTrack.addProcessor(processor);
  }
}

module.exports.displayLocalVideo = displayLocalVideo;
module.exports.filterLocalVideo = filterLocalVideo;
