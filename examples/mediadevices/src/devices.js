'use strict';

var Video = require('twilio-video');

function getDevicesOfKind(deviceInfos, kind) {
  return deviceInfos.filter(function(deviceInfo) {
    return deviceInfo.kind === kind;
  });
}

function applyAudioInputDeviceSelection(deviceId, $audio) {
  Video.createLocalAudioTrack({
    deviceId: deviceId
  }).then(function(localTrack) {
    localTrack.attach($audio.get(0));
  });
}

function applyAudioOutputDeviceSelection(deviceId, $audio) {
  $audio.get(0).setSinkId(deviceId);
}

function applyVideoInputDeviceSelection(deviceId, $video) {
  Video.createLocalVideoTrack({
    deviceId: deviceId,
    height: 240,
    width: 320
  }).then(function(localTrack) {
    localTrack.attach($video.get(0));
  });
}

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
