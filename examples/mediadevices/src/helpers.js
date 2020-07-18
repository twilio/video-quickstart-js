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
 * @param {LocalTrack} Track - LocalAudioTrack or LocalVideoTrack
 * @param {string} kind - kind of Track
 * @returns {Promise<void>}
 */
function applyInputDeviceSelection(deviceId, localTrack, kind) {
  if (localTrack) {
    localTrack.restart({ deviceId:  deviceId })
    .then(function() {
      console.log('local track in the promise', localTrack);
      return localTrack;
    }).catch(function(error) {
      console.log('applyInputDeviceSelection failed:', error);
    });

    } else {
    return kind === 'audio'
      ? Video.createLocalAudioTrack({ deviceId: { exact: deviceId } })
      : Video.createLocalVideoTrack({ deviceId: { exact: deviceId } });
  }
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

module.exports.applyInputDeviceSelection = applyInputDeviceSelection;
module.exports.applyAudioOutputDeviceSelection = applyAudioOutputDeviceSelection;
module.exports.getDeviceSelectionOptions = getDeviceSelectionOptions;
