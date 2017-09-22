'use strict';

var Prism = require('prismjs');
var getSnippet = require('../../util/getsnippet');
var helpers = require('./helpers');
var waveform = require('../../util/waveform');
var applyAudioInputDeviceSelection = helpers.applyAudioInputDeviceSelection;
var applyAudioOutputDeviceSelection = helpers.applyAudioOutputDeviceSelection;
var applyVideoInputDeviceSelection = helpers.applyVideoInputDeviceSelection;
var getDeviceSelectionOptions = helpers.getDeviceSelectionOptions;

var deviceSelections = {
  audioinput: document.querySelector('select#audioinput'),
  audiooutput: document.querySelector('select#audiooutput'),
  videoinput: document.querySelector('select#videoinput')
};

/**
 * Build the list of available media devices.
 */
function updateDeviceSelectionOptions() {
  getDeviceSelectionOptions().then(function (deviceSelectionOptions) {
    ['audioinput', 'audiooutput', 'videoinput'].forEach(function(kind) {
      var kindDeviceInfos = deviceSelectionOptions[kind];
      var select = deviceSelections[kind];

      [].slice.call(select.children).forEach(function(option) {
        option.remove();
      });

      kindDeviceInfos.forEach(function(kindDeviceInfo) {
        var deviceId = kindDeviceInfo.deviceId;
        var label = kindDeviceInfo.label || 'Device [ id: '
          + deviceId.substr(0, 5) + '... ]';

        var option = document.createElement('option');
        option.value = deviceId;
        option.appendChild(document.createTextNode(label));
        select.appendChild(option);
      });
    });

  });
}

// Load the code snippet.
getSnippet('./helpers.js').then(function(snippet) {
  var pre = document.querySelector('pre.language-javascript');
  pre.innerHTML = Prism.highlight(snippet, Prism.languages.javascript);
});

// Build the list of available media devices.
updateDeviceSelectionOptions();

// Whenever a media device is added or removed, update the list.
navigator.mediaDevices.ondevicechange = updateDeviceSelectionOptions;

// Apply the selected audio input media device.
document.querySelector('button#audioinputapply').onclick = function(event) {
  var audio = document.querySelector('audio#audioinputpreview');
  var waveformContainer = document.querySelector('div#audioinputwaveform');

  applyAudioInputDeviceSelection(deviceSelections.audioinput.value, audio).then(function() {
    var canvas = waveformContainer.querySelector('canvas');
    waveform.setStream(audio.srcObject);
    if (!canvas) {
      waveformContainer.appendChild(waveform.element);
    }
  });

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
