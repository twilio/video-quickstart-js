'use strict';

var devices = require('./devices');
var getSnippet = require('./getsnippet');
var Prism = require('prismjs');
var applyVideoInputDeviceSelection = devices.applyVideoInputDeviceSelection;
var updateDeviceSelectionOptions = devices.updateDeviceSelectionOptions;

var $deviceSelections = {
  'audioinput': $('select#audioinput'),
  'audiooutput': $('select#audiooutput'),
  'videoinput': $('select#videoinput')
};

// Build the list of available media devices.
updateDeviceSelectionOptions($deviceSelections);

// Load the code snippet.
getSnippet('./snippet.js').then(function(code) {
  var js = Prism.languages.javascript;
  $('code.language-javascript').html(Prism.highlight(code, js));
});

// Whenever a media device is added or removed, update the list.
navigator.mediaDevices.ondevicechange = function() {
  updateDeviceSelectionOptions($deviceSelections);
};

// Apply the selected video input media device.
$('button#videoinputapply').click(function(event) {
  var $video = $('video#videoinputpreview');
  applyVideoInputDeviceSelection($deviceSelections.videoinput.val(), $video);
  event.preventDefault();
});
