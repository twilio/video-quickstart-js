'use strict';

var devices = require('./devices');
var getSnippet = require('./getsnippet');
var Prism = require('prismjs');
var applyAudioInputDeviceSelection = devices.applyAudioInputDeviceSelection;
var applyAudioOutputDeviceSelection = devices.applyAudioOutputDeviceSelection;
var applyVideoInputDeviceSelection = devices.applyVideoInputDeviceSelection;
var updateDeviceSelectionOptions = devices.updateDeviceSelectionOptions;

var deviceSelections = {
  audioinput: document.querySelector('select#audioinput'),
  audiooutput: document.querySelector('select#audiooutput'),
  videoinput: document.querySelector('select#videoinput')
};

// Build the list of available media devices.
updateDeviceSelectionOptions(deviceSelections);

// Load the code snippet.
getSnippet('./snippet.js').then(function(snippet) {
  var js = Prism.languages.javascript;
  var code = document.querySelector('code.language-javascript');
  code.innerHTML = Prism.highlight(snippet, js);
});

// Whenever a media device is added or removed, update the list.
navigator.mediaDevices.ondevicechange = function() {
  updateDeviceSelectionOptions(deviceSelections);
};

// Apply the selected audio input media device.
document.querySelector('button#audioinputapply').onclick = function(event) {
  var audio = document.querySelector('audio#audioinputpreview');
  var waveformContainer = document.querySelector('div#audioinputwaveform');
  applyAudioInputDeviceSelection(deviceSelections.audioinput.value, audio, waveformContainer);
  event.preventDefault();
  event.stopPropagation();
};

// Apply the selected audio output media device.
document.querySelector('button#audiooutputapply').onclick = function(event) {
  var audio = document.querySelector('audio#audioinputpreview');
  applyAudioOutputDeviceSelection(deviceSelections.audiooutput.value, audio);
  event.preventDefault();
  event.stopPropagation();
};

// Apply the selected video input media device.
document.querySelector('button#videoinputapply').onclick = function(event) {
  var video = document.querySelector('video#videoinputpreview');
  applyVideoInputDeviceSelection(deviceSelections.videoinput.value, video);
  event.preventDefault();
  event.stopPropagation();
};
