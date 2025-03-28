'use strict';

const { isMobile } = require('./browser');
const joinRoom = require('./joinroom');
const selectMedia = require('./selectmedia');
const selectRoom = require('./selectroom');
const showError = require('./showerror');
const { adjustClientAreaOffset } = require('./citrix-helpers');
const { installCitrixWebRTCPolyfills } = require('./citrix-polyfills');

const $modals = $('#modals');
const $selectMicModal = $('#select-mic', $modals);
const $selectCameraModal = $('#select-camera', $modals);
const $showErrorModal = $('#show-error', $modals);
const $joinRoomModal = $('#join-room', $modals);

// ConnectOptions settings for a video web application.
const connectOptions = {
  // Available only in Small Group or Group Rooms only. Please set "Room Type"
  // to "Group" or "Small Group" in your Twilio Console:
  // https://www.twilio.com/console/video/configure
  bandwidthProfile: {
    video: {
      dominantSpeakerPriority: 'high',
      mode: 'collaboration',
      clientTrackSwitchOffControl: 'auto',
      contentPreferencesMode: 'auto'
    }
  },

  // Available only in Small Group or Group Rooms only. Please set "Room Type"
  // to "Group" or "Small Group" in your Twilio Console:
  // https://www.twilio.com/console/video/configure
  dominantSpeaker: true,

  // VP8 simulcast enables the media server in a Small Group or Group Room
  // to adapt your encoded video quality for each RemoteParticipant based on
  // their individual bandwidth constraints. This has no utility if you are
  // using Peer-to-Peer Rooms, so you can comment this line.
  preferredVideoCodecs: [{ codec: 'VP8', simulcast: true }],

  // Comment this line if you are playing music.
  maxAudioBitrate: 16000,

  // Capture 720p video @ 24 fps.
  video: { height: 720, frameRate: 24, width: 1280 }
};

// For mobile browsers, limit the maximum incoming video bitrate to 2.5 Mbps.
if (isMobile) {
  connectOptions
    .bandwidthProfile
    .video
    .maxSubscriptionBitrate = 2500000;
}

// On mobile browsers, there is the possibility of not getting any media even
// after the user has given permission, most likely due to some other app reserving
// the media device. So, we make sure users always test their media devices before
// joining the Room. For more best practices, please refer to the following guide:
// https://www.twilio.com/docs/video/build-js-video-application-recommendations-and-best-practices
const deviceIds = {
  audio: isMobile ? null : localStorage.getItem('audioDeviceId'),
  video: isMobile ? null : localStorage.getItem('videoDeviceId')
};

/**
 * Select your Room name, your screen name and join.
 * @param [error=null] - Error from the previous Room session, if any
 */
async function selectAndJoinRoom(error = null) {
  const formData = await selectRoom($joinRoomModal, error);
  if (!formData) {
    // User wants to change the camera and microphone.
    // So, show them the microphone selection modal.
    deviceIds.audio = null;
    deviceIds.video = null;
    return selectMicrophone();
  }
  const { identity, roomName } = formData;

  try {
    // Fetch an AccessToken to join the Room.
    const response = await fetch(`/token?identity=${identity}`);

    // Extract the AccessToken from the Response.
    const token = await response.text();

    // Add the specified audio device ID to ConnectOptions.
    connectOptions.audio = { deviceId: { exact: deviceIds.audio } };

    // Add the specified Room name to ConnectOptions.
    connectOptions.name = roomName;

    // Add the specified video device ID to ConnectOptions.
    connectOptions.video.deviceId = { exact: deviceIds.video };

    // Join the Room.
    await joinRoom(token, connectOptions);

    // After the video session, display the room selection modal.
    return selectAndJoinRoom();
  } catch (error) {
    return selectAndJoinRoom(error);
  }
}

/**
 * Select your camera.
 */
async function selectCamera() {
  if (deviceIds.video === null) {
    try {
      deviceIds.video = await selectMedia('video', $selectCameraModal, videoTrack => {
        const $video = $('video', $selectCameraModal);
        const videoElement = $video.get(0);
        videoTrack.attach(videoElement);
      });
    } catch (error) {
      showError($showErrorModal, error);
      return;
    }
  }
  return selectAndJoinRoom();
}

/**
 * Select your microphone.
 */
async function selectMicrophone() {
  if (deviceIds.audio === null) {
    try {
      deviceIds.audio = await selectMedia('audio', $selectMicModal, () => {});
    } catch (error) {
      showError($showErrorModal, error);
      return;
    }
  }
  return selectCamera();
}

// Ensure that Citrix WebRTC Redirection is fully initialized before starting the application.
window.addEventListener('CitrixLoaded', async () => {
  installCitrixWebRTCPolyfills();
  await adjustClientAreaOffset();
  selectMicrophone()
});

// Citrix initialization
async function initalizeCitrix() {
  function importCitrix() {
    return Promise.all([require('@citrix/ucsdk/CitrixBootstrap'), require('@citrix/ucsdk/CitrixWebRTC')]);
  }

  function handleCitrixInitialization(event) {
    console.log('Received Citrix event:', event);
    if (event.event === 'vdiClientConnected') {
      if (!window.CitrixWebRTC.isFeatureOn('webrtc1.0')) {
        throw new Error('Citrix WebRTC redirection feature is NOT supported!');
      }
      console.log('CitrixVDIStrategy initialized');
      // dispatch CitrixLoaded event to start the application
      window.dispatchEvent(new Event('CitrixLoaded'));
    } else if (event.event === 'vdiClientDisconnected') {
      console.log('vdiClientDisconnected');
    }
  }

  try {
    // Import Citrix libraries
    await importCitrix();

    if (!window.CitrixBootstrap || !window.CitrixWebRTC) {
      throw new Error('Citrix libraries not properly initialized on window object');
    }

    // Add global event listener for Citrix events
    window.CitrixWebRTC.setVMEventCallback(handleCitrixInitialization);

    // Initialize Citrix
    window.CitrixBootstrap.initBootstrap('twilio-citrix-partner');
    window.CitrixWebRTC.initUCSDK('twilio-citrix-partner');

  } catch (err) {
    console.error('Error initializing Citrix:', err);
  }
};

window.addEventListener('load', initalizeCitrix);
