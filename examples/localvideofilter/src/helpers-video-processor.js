'use strict';

var Video = require('twilio-video');

/**
 * Apply a filter to the frames of a LocalVideoTrack.
 * @param {number} width - Width in pixels of the video frames
 * @param {number} height - Height in pixels of the video frames
 * @param {'blur' | 'grayscale' | 'sepia'} name - Filter name
 * @param {string} settingValue - Filter setting value
 * @constructor
 */
function FilterVideoProcessor(width, height, name, settingValue) {
  this._outputFrame = new OffscreenCanvas(width, height);
  this._outputContext = this._outputFrame.getContext('2d');
  this._outputContext.filter = name + '(' + settingValue + ')';
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
    var value = name === 'blur' ? '5px' : '100%';
    var settings = filteredLocalTrack.mediaStreamTrack.getSettings();
    var height = settings.height;
    var width = settings.width;
    processor = new FilterVideoProcessor(width, height, name, value);
    filteredLocalTrack.addProcessor(processor);
  }
}

module.exports.displayLocalVideo = displayLocalVideo;
module.exports.filterLocalVideo = filterLocalVideo;
