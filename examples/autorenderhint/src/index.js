'use strict'

const Prism = require('prismjs');
const Video = require('twilio-video');
const DataSeries = require('../../util/timelinegraph').DataSeries;
const GraphView = require('../../util/timelinegraph').GraphView;
const getSnippet = require('../../util/getsnippet');
const getRoomCredentials = require('../../util/getroomcredentials');
const helpers = require('./helpers');
const joinRoom = helpers.joinRoom;

const renderDimensionsOption = document.querySelector('select#renderDimensionsOption');
const videoContainer = document.querySelector('div#video-container');
const videoEl = document.querySelector('video#remotevideo');
const visibilityToggleButton = document.querySelector('button#visibilityToggleButton');
const trackIsSwitchedOff = document.querySelector('span#trackIsSwitchedOff');
let roomP1 = null;
let stopVideoBitrateGraph = null;

/**
 * Set up the bitrate graph for audio or video media.
 */
 function setupBitrateGraph(kind, containerId, canvasId) {
  const bitrateSeries = new DataSeries();
  const bitrateGraph = new GraphView(containerId, canvasId);

  bitrateGraph.graphDiv_.style.display = 'none';
  return async function startBitrateGraph(room, intervalMs) {
    let bytesReceivedPrev = 0;
    let timestampPrev = Date.now();
    const interval = setInterval(async function() {
      if (!room) {
        clearInterval(interval);
        return;
      }
      const stats = await room.getStats();
      const remoteTrackStats = kind === 'audio'
        ? stats[0].remoteAudioTrackStats[0]
        : stats[0].remoteVideoTrackStats[0]
      const bytesReceived = remoteTrackStats.bytesReceived;
      const timestamp = remoteTrackStats.timestamp;
      const bitrate = Math.round((bytesReceivedPrev - bytesReceived) * 8 / (timestampPrev - timestamp));

      bitrateSeries.addPoint(timestamp, bitrate);
      bitrateGraph.setDataSeries([bitrateSeries]);
      bitrateGraph.updateEndDate();
      bytesReceivedPrev = bytesReceived;
      timestampPrev = timestamp;
    }, intervalMs);

    bitrateGraph.graphDiv_.style.display = '';
    return function stop() {
      clearInterval(interval);
      bitrateGraph.graphDiv_.style.display = 'none';
    };
  };
}

const handleIsSwitchedOff = (trackState) => {
  if(trackState) {
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
        contentPreferencesMode: 'auto',
        clientTrackSwitchOffControl: 'auto'
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

      visibilityToggleButton.classList.remove('disabled');
      renderDimensionsOption.classList.remove('disabled');

      track.on('switchedOff', track => {
        handleIsSwitchedOff(track.isSwitchedOff);
      });
      track.on('switchedOn', track => {
        handleIsSwitchedOff(track.isSwitchedOff);
      });
    }
  });

  // Toggle Remote Video visibility
  visibilityToggleButton.onclick = event => {
    videoEl.hidden = videoEl.hidden ? false : true;
    videoContainer.hidden = videoContainer.hidden ? false : true;
    visibilityToggleButton.textContent = visibilityToggleButton.textContent === 'Toggle On' ? 'Toggle Off' : 'Toggle On';
  }

  const renderDimensionsObj = {
    HD: { width: 1280, height: 720 },
    VGA: { width: 640, height: 480 },
    QCIF: { width: 176, height: 144}
  }

  // Adjust Remote Video element size.
  renderDimensionsOption.addEventListener('change', () => {
    const renderDimensions = renderDimensionsObj[renderDimensionsOption.value];
    videoEl.style.height = `${renderDimensions.height}px`;
    videoEl.style.width = `${renderDimensions.width}px`;
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
