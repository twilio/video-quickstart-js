'use strict';

function getDevicesOfKind(deviceInfos, kind) {
  return deviceInfos.filter(function(deviceInfo) {
    return deviceInfo.kind === kind;
  });
}

function applyVideoInputDeviceSelection(deviceId, $video) {
  navigator.mediaDevices.getUserMedia({
    video: {
      deviceId: deviceId,
      height: 240,
      width: 320
    }
  }).then(function(mediaStream) {
    $video.get(0).srcObject = mediaStream;
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

module.exports.applyVideoInputDeviceSelection = applyVideoInputDeviceSelection;
module.exports.updateDeviceSelectionOptions = updateDeviceSelectionOptions;
