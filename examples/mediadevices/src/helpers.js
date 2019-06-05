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

function switchLocalTracks(room, newLockTrack) {
  if (room) {
      room.localParticipant.tracks.forEach(function(trackPublication) {
      if (trackPublication.kind === newLockTrack.kind) {
        room.localParticipant.unpublishTrack(trackPublication.track);
      }
    });
    room.localParticipant.publishTrack(newLockTrack);
  }
}

/**
 * Apply the selected audio input device.
 * @param {string} deviceId
 * @param {HTMLAudioElement} audio
 * @param {Room} [room] to switch tracks on.
 * @returns {Promise<void>}
 */
function applyAudioInputDeviceSelection(deviceId, audio, room) {
  return Video.createLocalAudioTrack({
    deviceId: {
      exact: deviceId // NOTE: on ios safari - it respects the deviceId only if its exact.
    }
  }).then(function(localTrack) {
    localTrack.attach(audio);
    switchLocalTracks(room, localTrack);
  }).catch(function(error) {
    console.log('applyAudioInputDeviceSelection failed:', error);
  });
}

/**
 * Apply the selected video input device.
 * @param {string} deviceId
 * @param {HTMLVideoElement} video
 * @param {Room} [room] to switch tracks on.
 * @returns {Promise<void>}
 */
function applyVideoInputDeviceSelection(deviceId, video, room) {
  return Video.createLocalVideoTrack({
    deviceId: {
      exact: deviceId // NOTE: on ios safari - it respects the deviceId only if its exact.
    }
  }).then(function(localTrack) {
    localTrack.attach(video);
    switchLocalTracks(room, localTrack);
  }).catch(function(error) {
    console.log('applyVideoInputDeviceSelection failed:', error);
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
    var kinds = ['audioinput', 'audiooutput', 'videoinput'];
    return kinds.reduce(function(deviceSelectionOptions, kind) {
      deviceSelectionOptions[kind] = getDevicesOfKind(deviceInfos, kind);
      return deviceSelectionOptions;
    }, {});
  });
}

/**
 * Connects to room using specified input devices
 * @param {string} tokenCreds
 * @param {string} videoDeviceId
 * @param {string} audioDeviceId
 * @returns {Promise<Room>}
 */
function connectWithSelectedDevices(tokenCreds, videoDeviceId, audioDeviceId) {
  return Video.connect(tokenCreds, {
    name: 'maks', // TODO: temp - remove this.
    audio: { deviceId: { exact: audioDeviceId } },
    video: { deviceId: { exact: videoDeviceId } }
  });
}

module.exports.applyAudioInputDeviceSelection = applyAudioInputDeviceSelection;
module.exports.applyVideoInputDeviceSelection = applyVideoInputDeviceSelection;
module.exports.connectWithSelectedDevices = connectWithSelectedDevices;
module.exports.getDeviceSelectionOptions = getDeviceSelectionOptions;
