
// Get the list of available devices of a certain kind.
function getDevices(kind) {
  return navigator.mediaDevices.enumerateDevices(deviceInfos => {
    return deviceInfos.filter(deviceInfo => deviceInfo.kind === kind);
  });
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

// Request media from a particular audio input device.
function getMediaFromAudioInput(deviceInfo) {
  var deviceId = deviceInfo.deviceId;
  return navigator.mediaDevices.getUserMedia({
    audio: { deviceId }
  });
}

getMediaFromAudioInput(deviceInfo).then(mediaStream => {
  console.log('MediaStream of given audio input device:', mediaStream);
});
