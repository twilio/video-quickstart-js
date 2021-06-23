'use strict'

const Prism = require('prismjs');
const Video = require('twilio-video');
const getSnippet = require('../../util/getsnippet');
const getRoomCredentials = require('../../util/getroomcredentials');
const setupBitrateGraph = require('../../util/setupbitrategraph');
const helpers = require('./helpers');
const joinRoom = helpers.joinRoom;
const switchOn = helpers.switchOn;
const switchOff = helpers.switchOff;
const setRenderDimensions = helpers.setRenderDimensions;

const renderDimensionsOption = document.querySelector('select#renderDimensionsOption');
const switchOnBtn = document.querySelector('button#switchOn');
const switchOffBtn = document.querySelector('button#switchOff');
const videoEl = document.querySelector('video#remotevideo');
const trackIsSwitchedOff = document.querySelector('span#trackIsSwitchedOff');
let roomP1 = null;
let remoteVideoTrack = null;
let stopVideoBitrateGraph = null;

const handleIsSwitchedOff = (isTrackSwitchedOff) => {
  if(isTrackSwitchedOff) {
    trackIsSwitchedOff.textContent = 'Off';
    trackIsSwitchedOff.classList.remove('badge-success');
    trackIsSwitchedOff.classList.add('badge-danger');
  } else {
    trackIsSwitchedOff.textContent = 'On';
    trackIsSwitchedOff.classList.remove('badge-danger');
    trackIsSwitchedOff.classList.add('badge-success');
  }
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
  roomP1 = await joinRoom(credsP1.token);

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

  // Set video bitrate graph.
  let startVideoBitrateGraph = setupBitrateGraph('video', 'videobitrategraph', 'videobitratecanvas');

  // Attach RemoteVideoTrack
  roomP1.on('trackSubscribed', track => {
    if(track.kind === 'video') {
      track.attach(videoEl);
      handleIsSwitchedOff(track.isSwitchedOff);
      stopVideoBitrateGraph = startVideoBitrateGraph(roomP1, 1000);

      switchOnBtn.classList.remove('disabled');
      switchOffBtn.classList.remove('disabled');
      renderDimensionsOption.classList.remove('disabled');

      track.on('switchedOff', track => {
        handleIsSwitchedOff(track.isSwitchedOff);
      });
      track.on('switchedOn', track => {
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
    HD: { width: 1280, height: 720 },
    VGA: { width: 640, height: 480 },
    QCIF: { width: 176, height: 144}
  }

  // Set Render Dimensions.
  renderDimensionsOption.addEventListener('change', () => {
    const renderDimensions = renderDimensionsObj[renderDimensionsOption.value];
    setRenderDimensions(remoteVideoTrack, { renderDimensions });
  });

  // Disconnect from the Room
  window.onbeforeunload = () => {
    if (stopVideoBitrateGraph) {
      stopVideoBitrateGraph();
    }
    roomP1.disconnect();
    roomP2.disconnect();
  }
}());
