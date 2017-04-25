'use strict';

var Video = require('twilio-video');
var Waveform = require('./waveform');
var waveform = new Waveform();

/**
 * Create Waveform for the given HTMLAudioElement on the given HTMLDivElement.
 * @param {HTMLDivElement} container
 * @param {HTMLAudioElement} audio
 */
function createAudioInputSpectrogram(container, audio) {
  waveform.setStream(audio.srcObject);
  var canvas = waveform.element;
  canvas.style.backgroundColor = '#eee';
  container.appendChild(canvas);
}

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
 * @param {HTMLDivElement} waveformContainer
 */
function applyAudioInputDeviceSelection(deviceId, audio, waveformContainer) {
  Video.createLocalAudioTrack({
    deviceId: deviceId
  }).then(function(localTrack) {
    localTrack.attach(audio);
    createAudioInputSpectrogram(waveformContainer, audio);
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
 */
function applyVideoInputDeviceSelection(deviceId, video) {
  Video.createLocalVideoTrack({
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
      var optionsHtml = kindDeviceInfos.map(function(kindDeviceInfo) {
        return '<option value='
          + kindDeviceInfo.deviceId
          + '>'
          + kindDeviceInfo.label
          + '</option>';
      }).join('');
      deviceSelections[kind].innerHTML = optionsHtml;
    });
  });
}

module.exports.applyAudioInputDeviceSelection = applyAudioInputDeviceSelection;
module.exports.applyAudioOutputDeviceSelection = applyAudioOutputDeviceSelection;
module.exports.applyVideoInputDeviceSelection = applyVideoInputDeviceSelection;
module.exports.updateDeviceSelectionOptions = updateDeviceSelectionOptions;
