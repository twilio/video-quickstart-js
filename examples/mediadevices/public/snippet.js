'use strict';

var Video = require('twilio-video');

/**
 * Get the list of available media devices of the given kind.
 * @param {Array<MediaDeviceInfo>} deviceInfos
 * @param {string} kind - One of 'audioinput', 'audiooutput', 'videoinput'
 * @returns {Array<MediaDeviceInfo>} Only those media devices of the given kind.
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
 * Update the UI with the list of available media devices.
 * @param {object} deviceSelections - <select> elements for audio input,
 *    audio output and video input device lists
 */
function updateDeviceSelectionOptions(deviceSelections) {
  navigator.mediaDevices.enumerateDevices().then(function(deviceInfos) {
    ['audioinput', 'audiooutput', 'videoinput'].forEach(function(kind) {
      var kindDeviceInfos = getDevicesOfKind(deviceInfos, kind);
      kindDeviceInfos.forEach(function(kindDeviceInfo) {
        var deviceId = kindDeviceInfo.deviceId;
        var label = kindDeviceInfo.label || 'Device [ id: ' + deviceId.substr(0, 5) + '... ]';
        var option = document.createElement('option');
        option.value = deviceId;
        option.appendChild(document.createTextNode(label));
        deviceSelections[kind].appendChild(option);
      });
    });
  });
}

module.exports.applyAudioInputDeviceSelection = applyAudioInputDeviceSelection;
module.exports.applyAudioOutputDeviceSelection = applyAudioOutputDeviceSelection;
module.exports.applyVideoInputDeviceSelection = applyVideoInputDeviceSelection;
module.exports.updateDeviceSelectionOptions = updateDeviceSelectionOptions;
