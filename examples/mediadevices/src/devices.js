'use strict';

var Spectrogram = require('spectrogram');
var Video = require('twilio-video');
var audioContext = new AudioContext();

/**
 * Create spectrogram for the given HTMLAudioElement on the given HTMLCanvasElement.
 * @param {$(HTMLCanvasElement)} $canvas
 * @param {$(HTMLAudioElement)} $audio
 */
function createAudioInputSpectrogram($canvas, $audio) {
  var analyser = audioContext.createAnalyser();
  analyser.smoothingTimeConstant = 0;
  analyser.fftSize = 2048;

  var source = audioContext.createMediaStreamSource($audio.get(0).srcObject);
  source.connect(analyser);

  var spectrogram = new Spectrogram($canvas.get(0), {
    audio: { enable: false }
  });
  spectrogram.connectSource(analyser, audioContext);
  spectrogram.start();
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
 * @param {$(HTMLAudioElement)} $audio
 * @param {$(HTMLCanvasElement)} $canvas
 */
function applyAudioInputDeviceSelection(deviceId, $audio, $canvas) {
  Video.createLocalAudioTrack({
    deviceId: deviceId
  }).then(function(localTrack) {
    localTrack.attach($audio.get(0));
    createAudioInputSpectrogram($canvas, $audio);
  });
}

/**
 * Apply the selected audio output device.
 * @param {string} deviceId
 * @param {$(HTMLAudioElement)} $audio
 */
function applyAudioOutputDeviceSelection(deviceId, $audio) {
  $audio.get(0).setSinkId(deviceId);
}

/**
 * Apply the selected video input device.
 * @param {string} deviceId
 * @param {$(HTMLVideoElement)} $video
 */
function applyVideoInputDeviceSelection(deviceId, $video) {
  Video.createLocalVideoTrack({
    deviceId: deviceId,
    height: 240,
    width: 320
  }).then(function(localTrack) {
    localTrack.attach($video.get(0));
  });
}

/**
 * Update the UI with the list of available media devices.
 * @param {object} $deviceSelections - <select> elements for audio input,
 *    audio output and video input device lists
 */
function updateDeviceSelectionOptions($deviceSelections) {
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
      $deviceSelections[kind].html(optionsHtml);
    });
  });
}

module.exports.applyAudioInputDeviceSelection = applyAudioInputDeviceSelection;
module.exports.applyAudioOutputDeviceSelection = applyAudioOutputDeviceSelection;
module.exports.applyVideoInputDeviceSelection = applyVideoInputDeviceSelection;
module.exports.updateDeviceSelectionOptions = updateDeviceSelectionOptions;
