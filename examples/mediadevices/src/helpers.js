'use strict';

var Video = require('twilio-video');

/**
 * Get the list of available media devices of the given kind.
 * @param {Array<MediaDeviceInfo>} deviceInfos
 * @param {string} kind - One of 'audioinput', 'audiooutput', 'videoinput'
 * @returns {Array<MediaDeviceInfo>} - Only those media devices of the given kind
 */
function getDevicesOfKind(deviceInfos, kind) {
  return deviceInfos.filter(function(deviceInfo) {
    return deviceInfo.kind === kind;
  });
}

/**
 * Apply the selected audio input device.
 * @param {string} deviceId
 * @param {HTMLAudioElement} audio
 * @returns {Promise<void>}
 */
function applyAudioInputDeviceSelection(deviceId, audio) {
  return Video.createLocalAudioTrack({
    deviceId: deviceId
  }).then(function(localTrack) {
    localTrack.attach(audio);
  });
}

/**
 * Apply the selected audio output device.
 * @param {string} deviceId
 * @param {HTMLAudioElement} audio
 */
function applyAudioOutputDeviceSelection(deviceId, audio) {
  audio.setSinkId(deviceId);
}

/**
 * Apply the selected video input device.
 * @param {string} deviceId
 * @param {HTMLVideoElement} video
 * @returns {Promise<void>}
 */
function applyVideoInputDeviceSelection(deviceId, video) {
  return Video.createLocalVideoTrack({
    deviceId: deviceId,
    height: 240,
    width: 320
  }).then(function(localTrack) {
    localTrack.attach(video);
  });
}

/**
 * Get the list of available media devices.
 * @returns {Promise<DeviceSelectionOptions>}
 * @typedef {object} DeviceSelectionOptions
 * @property {Array<MediaDeviceInfo>} audioinput
 * @property {Array<MediaDeviceInfo>} audiooutput
 * @property {Array<MediaDeviceInfo>} videoinput
 */
function getDeviceSelectionOptions() {
  return navigator.mediaDevices.enumerateDevices().then(function(deviceInfos) {
    var kinds = [ 'audioinput', 'audiooutput', 'videoinput' ];
    return kinds.reduce(function(deviceSelectionOptions, kind) {
      deviceSelectionOptions[kind] = getDevicesOfKind(deviceInfos, kind);
      return deviceSelectionOptions;
    }, {});
  });
}

module.exports.applyAudioInputDeviceSelection = applyAudioInputDeviceSelection;
module.exports.applyAudioOutputDeviceSelection = applyAudioOutputDeviceSelection;
module.exports.applyVideoInputDeviceSelection = applyVideoInputDeviceSelection;
module.exports.getDeviceSelectionOptions = getDeviceSelectionOptions;
