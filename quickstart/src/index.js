'use strict';

const { isMobile } = require('./browser');
const joinRoom = require('./joinroom');
const micLevel = require('./miclevel');
const selectMedia = require('./selectmedia');
const selectRoom = require('./selectroom');

const $modals = $('#modals');
const $selectMicModal = $('#select-mic', $modals);
const $selectCameraModal = $('#select-camera', $modals);
const $joinRoomModal = $('#join-room', $modals);

const connectOptions = isMobile ? {
  // Available only in Small Group or Group Rooms only. Please set "Room Type"
  // to "Group" or "Small Group" in your Twilio Console:
  // https://www.twilio.com/console/video/configure
  bandwidthProfile: {
    video: {
      dominantSpeakerPriority: 'high',
      maxSubscriptionBitrate: 2500000,
      mode: 'collaboration',
      renderDimensions: {
        high: { height: 720, width: 1280 },
        standard: { height: 90, width: 160 }
      }
    }
  },

  // Available only in Small Group or Group Rooms only. Please set "Room Type"
  // to "Group" or "Small Group" in your Twilio Console:
  // https://www.twilio.com/console/video/configure
  dominantSpeaker: true,

  // Uncomment this line to enable verbose logging.
  // logLevel: 'debug'

  // Comment this line if you are playing music.
  maxAudioBitrate: 16000,

  // Comment this line if you are in a Peer-to-Peer Room.
  preferredVideoCodecs: [{ codec: 'VP8', simulcast: true }],

  // For mobile browsers, capture 360p video @ 24 fps.
  video: { height: 720, frameRate: 24, width: 1280 }
} : {
  // Available only in Small Group or Group Rooms only. Please set "Room Type"
  // to "Group" or "Small Group" in your Twilio Console:
  // https://www.twilio.com/console/video/configure
  bandwidthProfile: {
    video: {
      dominantSpeakerPriority: 'high',
      mode: 'collaboration',
      renderDimensions: {
        high: { height: 720, width: 1280 },
        standard: { height: 90, width: 160 }
      }
    }
  },

  // Available only in Small Group or Group Rooms only. Please set "Room Type"
  // to "Group" or "Small Group" in your Twilio Console:
  // https://www.twilio.com/console/video/configure
  dominantSpeaker: true,

  // Comment this line to disable verbose logging.
  logLevel: 'debug',

  // Comment this line if you are playing music.
  maxAudioBitrate: 16000,

  // Comment this line if you are in a Peer-to-Peer Room.
  preferredVideoCodecs: [{ codec: 'VP8', simulcast: true }],

  // For desktop browsers, capture 720p video @ 24 fps.
  video: { height: 720, frameRate: 24, width: 1280 }
};

// Selected microphone and camera device IDs.
const deviceIds = {
  audio: null,
  video: null
};

/**
 * Select your Room name, your screen name and join.
 */
function selectAndJoinRoom() {
  return selectRoom($joinRoomModal).then(identityAndRoomName => {
    if (!identityAndRoomName) {
      // User wants to change the camera and microphone.
      // So, show them the microphone selection modal.
      deviceIds.audio = null;
      deviceIds.video = null;
      return selectMicrophone();
    }
    const { identity, roomName } = identityAndRoomName;

    // Fetch an AccessToken to join the Room.
    return fetch(`/token?identity=${identity}`).then(response => {
      return response.text();
    }).then(token => {
      // Add the specified audio device ID to ConnectOptions.
      connectOptions.audio = { deviceId: { exact: deviceIds.audio } };

      // Add the specified Room name to ConnectOptions.
      connectOptions.name = roomName;

      // Add the specified video device ID to ConnectOptions.
      connectOptions.video.deviceId = { exact: deviceIds.video };

      // Join the Room.
      return joinRoom(token, connectOptions);
    });
  }).then(selectMicrophone);
}

/**
 * Select your camera.
 */
function selectCamera() {
  if (deviceIds.video !== null) {
    return selectAndJoinRoom();
  }
  return selectMedia('video', $selectCameraModal, stream => {
    const $video = $('video', $selectCameraModal);
    $video.get(0).srcObject = stream;
  }).then(deviceId => {
    deviceIds.video = deviceId;
    return selectAndJoinRoom();
  });
}

/**
 * Select your microphone.
 */
function selectMicrophone() {
  if (deviceIds.audio !== null) {
    return selectCamera();
  }
  return selectMedia('audio', $selectMicModal, stream => {
    const $levelIndicator = $('svg rect', $selectMicModal);
    const maxLevel = Number($levelIndicator.attr('height'));
    micLevel(stream, maxLevel, level => $levelIndicator.attr('y', maxLevel - level));
  }).then(deviceId => {
    deviceIds.audio = deviceId;
    return selectCamera();
  });
}

window.addEventListener('load', selectMicrophone);
