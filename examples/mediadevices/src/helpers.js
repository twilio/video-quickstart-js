/* eslint-disable no-console */
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
 * Apply the selected audio output device.
 * @param {string} deviceId
 * @param {HTMLAudioElement} audio
 * @returns {Promise<void>}
 */
function applyAudioOutputDeviceSelection(deviceId, audio) {
  return typeof audio.setSinkId === 'function'
    ? audio.setSinkId(deviceId)
    : Promise.reject('This browser does not support setting an audio output device');
}

/**
 * Apply the selected audio input device.
 * @param {string} deviceId
 * @param {LocalAudioTrack} audioTrack - LocalAudioTrack
 * @returns {Promise<void>}
 */
function applyAudioInputDeviceSelection(deviceId, audioTrack) {
  return audioTrack.restart({ deviceId: deviceId }).catch(function(error) {
    console.log('applyAudioInputDeviceSelection failed: ', error);
  });
}

/**
 * Apply the selected video input device.
 * @param {string} deviceId
 * @param {HTMLVideoElement} videoTrack - LocalVideoTrack
 * @returns {Promise<void>}
 */
function applyVideoInputDeviceSelection(deviceId, videoTrack) {
  return videoTrack.restart({ deviceId: deviceId }).catch(function(error) {
    console.log('applyVideoInputDeviceSelection failed: ', error);
  });
}

/**
 * Ensure that media permissions are obtained.
 * @returns {Promise<void>}
 */
function ensureMediaPermissions() {
  return navigator.mediaDevices.enumerateDevices().then(function(devices) {
    return devices.every(function(device) {
      return !(device.deviceId && device.label);
    });
  }).then(function(shouldAskForMediaPermissions) {
    if (shouldAskForMediaPermissions) {
      return navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(function(mediaStream) {
        mediaStream.getTracks().forEach(function(track) {
          track.stop();
        });
      });
    }
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
  // before calling enumerateDevices, get media permissions (.getUserMedia)
  // w/o media permissions, browsers do not return device Ids and/or labels.
  return ensureMediaPermissions().then(function() {
    return navigator.mediaDevices.enumerateDevices().then(function(deviceInfos) {
      var kinds = ['audioinput', 'audiooutput', 'videoinput'];
      return kinds.reduce(function(deviceSelectionOptions, kind) {
        deviceSelectionOptions[kind] = getDevicesOfKind(deviceInfos, kind);
        return deviceSelectionOptions;
      }, {});
    });
  });
}

/**
 * Connects to room using specified input devices
 * @param {string} token
 * @param {string} audioDeviceId
 * @param {string} videoDeviceId
 * @returns {Promise<Room>}
 */
function connectWithSelectedDevices(token, audioDeviceId, videoDeviceId) {
  return Video.connect(token, {
    audio: { deviceId: { exact: audioDeviceId } },
    video: { deviceId: { exact: videoDeviceId } }
  });
}

module.exports.applyAudioInputDeviceSelection = applyAudioInputDeviceSelection;
module.exports.applyAudioOutputDeviceSelection = applyAudioOutputDeviceSelection;
module.exports.applyVideoInputDeviceSelection = applyVideoInputDeviceSelection;
module.exports.connectWithSelectedDevices = connectWithSelectedDevices;
module.exports.getDeviceSelectionOptions = getDeviceSelectionOptions;
