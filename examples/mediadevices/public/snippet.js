'use strict';

const {
  __createLocalAudioTrack__,
  __createLocalVideoTrack__,
  __LocalAudioTrack__,
  __LocalVideoTrack__
} = require('twilio-video');

/**
 * Get the list of available devices of the given kind.
 * @param {string} kind
 * @returns {Array<MediaDeviceInfo>}
 */
function getDevices(kind) {
  return navigator.mediaDevices.enumerateDevices(deviceInfos => {
    return deviceInfos.filter(deviceInfo => deviceInfo.kind === kind);
  });
}

/**
 * Request media from a particular audio input device.
 * @param {MediaDeviceInfo} deviceInfo
 * @returns {Promise<__LocalAudioTrack__>}
 */
function getMediaFromAudioInput(deviceInfo) {
  var deviceId = deviceInfo.deviceId;
  return __createLocalAudioTrack__({ deviceId });
}

/**
 * Request media from a particular video input device.
 * @param {MediaDeviceInfo} deviceInfo
 * @returns {Promise<__LocalVideoTrack__>}
 */
function getMediaFromVideoInput(deviceInfo) {
  var deviceId = deviceInfo.deviceId;
  return __createLocalVideoTrack__({ deviceId });
}

/**
 * Set the audio output device of an HTMLMediaElement.
 * @param {MediaDeviceInfo} deviceInfo
 * @param {HTMLMediaElement} mediaElement
 */
function setAudioOutputDevice(deviceInfo, mediaElement) {
  mediaElement.setSinkId(deviceInfo.deviceId);
}

// Get the list of available audio input devices.
getDevices('audioinput').then(deviceInfos => {
  console.log('Available audio input devices:', deviceInfos);
});

// Get the list of available video input devices.
getDevices('videoinput').then(deviceInfos => {
  console.log('Available video input devices:', deviceInfos);
});

// Get the list of available audio output devices.
getDevices('audiooutput').then(deviceInfos => {
  console.log('Available audio output devices:', deviceInfos);
});

// Request a __LocalAudioTrack__ from the selected audio device.
getMediaFromAudioInput(audioInputDeviceInfo).then(localAudioTrack => {
  console.log('LocalTrack of given audio input device:', localAudioTrack);
});

// Request a __LocalVideoTrack__ from the selected video device.
getMediaFromVideoInput(videoInputDeviceInfo).then(localVideoTrack => {
  console.log('LocalTrack of given video input device:', localVideoTrack);
});
