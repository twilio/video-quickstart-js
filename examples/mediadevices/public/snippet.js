
const { createLocalAudioTrack, createLocalVideoTrack } = require('twilio-video');

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
  return createLocalAudioTrack({ deviceId });
}
getMediaFromAudioInput(audioInputDeviceInfo).then(localAudioTrack => {
  console.log('LocalTrack of given audio input device:', localAudioTrack);
});

// Request media from a particular video input device.
function getMediaFromVideoInput(deviceInfo) {
  var deviceId = deviceInfo.deviceId;
  return createLocalVideoTrack({ deviceId });
}
getMediaFromVideoInput(videoInputDeviceInfo).then(localVideoTrack => {
  console.log('LocalTrack of given video input device:', localVideoTrack);
});

// Set the audio output device of an HTML media element.
function setAudioOutputDevice(deviceInfo, mediaElement) {
  mediaElement.setSinkId(deviceInfo.deviceId);
}
