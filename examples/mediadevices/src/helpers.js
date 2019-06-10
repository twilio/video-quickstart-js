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
 * Replace the existing LocalAudioTrack or LocalVideoTrack with
 * a new one in the Room.
 * @param {Room} room - The Room you have joined
 * @param {LocalAudioTrack|LocalVideoTrack} track - The LocalTrack you want to switch to
 * @returns {void}
 */
function switchLocalTracks(room, track) {
  room.localParticipant.tracks.forEach(function(trackPublication) {
    if (trackPublication.kind === track.kind) {
      trackPublication.track.stop();
      room.localParticipant.unpublishTrack(trackPublication.track);
    }
  });
  room.localParticipant.publishTrack(track);
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
 * @param {HTMLAudioElement} audio
 * @param {Room} [room] - The Room, if you have already joined one
 * @returns {Promise<void>}
 */
function applyAudioInputDeviceSelection(deviceId, audio, room) {
  return Video.createLocalAudioTrack({
    deviceId: {
      exact: deviceId // NOTE: on ios safari - it respects the deviceId only if its exact.
    }
  }).then(function(localTrack) {
    localTrack.attach(audio);
    if (room) {
      switchLocalTracks(room, localTrack);
    }
  }).catch(function(error) {
    console.log('applyAudioInputDeviceSelection failed:', error);
  });
}

/**
 * Apply the selected video input device.
 * @param {string} deviceId
 * @param {HTMLVideoElement} video
 * @param {Room} [room] - The Room, if you have already joined one
 * @returns {Promise<void>}
 */
function applyVideoInputDeviceSelection(deviceId, video, room) {
  return Video.createLocalVideoTrack({
    deviceId: {
      exact: deviceId
    }
  }).then(function(localTrack) {
    localTrack.attach(video);
    if (room) {
      switchLocalTracks(room, localTrack);
    }
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
