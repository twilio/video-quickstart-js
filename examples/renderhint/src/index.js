'use strict'

const Prism = require('prismjs');
const Video = require('twilio-video');
const getSnippet = require('../../util/getsnippet');
const getRoomCredentials = require('../../util/getroomcredentials');
const helpers = require('./helpers');
const switchOn = helpers.switchOn;
const switchOff = helpers.switchOff;
const setRenderDimensions = helpers.setRenderDimensions;
const renderDimensionsOption = document.querySelector('select#renderDimensionsOption');
const switchOnBtn = document.querySelector('button#switchOn');
const switchOffBtn = document.querySelector('button#switchOff');
const videoEl = document.querySelector('video#remotevideo');
const trackIsSwitchedOff = document.querySelector('span.trackIsSwitchedOff');

const handleIsSwitchedOff = (trackState) => {
  trackIsSwitchedOff.textContent = trackState;
}

(async function(){
  // Load the code snippet.
  const snippet = await getSnippet('./helpers.js');
  const pre = document.querySelector('pre.language-javascript');

  pre.innerHTML = Prism.highlight(snippet, Prism.languages.javascript);

  const logger = Video.Logger.getLogger('twilio-video');
  logger.setLevel('silent');

  // Get the credentials to connect to the Room.
  const credsP1 = await getRoomCredentials();
  const credsP2 = await getRoomCredentials();

  // Create room instance and name for participants to join.
  const roomP1 = await Video.connect(credsP1.token, {
    name: 'my-cool-room',
    bandwidthProfile: {
      video: {
        contentPreferencesMode: 'manual',
        clientTrackSwitchOffControl: 'manual'
      }
    }
  });

  // Create the video track for the Remote Participant.
  const videoTrack = await Video.createLocalVideoTrack();

  // Connecting remote participant.
  const roomP2 = await Video.connect(credsP2.token, {
    name: 'my-cool-room',
    bandwidthProfile: {
      video: {
        contentPreferencesMode: 'manual',
        clientTrackSwitchOffControl: 'manual'
      }
    },
    tracks: [ videoTrack ]
  });

  // Attach RemoteVideoTrack
  let remoteVideoTrack;
  roomP1.on('trackSubscribed', track => {
    if(track.kind === 'video') {
      track.attach(videoEl);
      remoteVideoTrack = track;
      handleIsSwitchedOff(track.isSwitchedOff);
      switchOnBtn.classList.remove('disabled');
      switchOffBtn.classList.remove('disabled');
      renderDimensionsOption.classList.remove('disabled');

      remoteVideoTrack.on('switchedOff', track => {
        handleIsSwitchedOff(track.isSwitchedOff);
      });
      remoteVideoTrack.on('switchedOn', track => {
        handleIsSwitchedOff(track.isSwitchedOff);
      });
    }
  });

  // Remote Track Switch On
  switchOnBtn.onclick = event => {
    switchOn(remoteVideoTrack);
  }

  // Remote Track Switch Off
  switchOffBtn.onclick = event => {
    switchOff(remoteVideoTrack);
  }

  const renderDimensionsObj = {
    1: { width: 1280, height: 720 },
    2: { width: 640, height: 480 },
    3: { width: 176, height: 144}
  }

  // Set Render Dimensions.
  renderDimensionsOption.addEventListener('change', () => {
    const renderDimensions = renderDimensionsObj[renderDimensionsOption.value];
    setRenderDimensions(remoteVideoTrack, { renderDimensions });
  });

  // Disconnect from the Room
  window.onbeforeunload = () => {
    roomP1.disconnect();
    roomP2.disconnect();
  }
}());
