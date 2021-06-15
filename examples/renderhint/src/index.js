'use strict'

const Prism = require('prismjs');
const Video = require('twilio-video');
const DataSeries = require('../../util/timelinegraph').DataSeries;
const GraphView = require('../../util/timelinegraph').GraphView;
const getSnippet = require('../../util/getsnippet');
const getRoomCredentials = require('../../util/getroomcredentials');
const helpers = require('./helpers');
const switchOn = helpers.switchOn;
const switchOff = helpers.switchOff;
const setRenderDimensions = helpers.setRenderDimensions;

const renderDimensionsOption = document.querySelector('select#renderDimensionsOption');
const switchOnOffBtn = document.querySelector('button#switchOnOff');
const videoEl = document.querySelector('video#remotevideo');
const trackIsSwitchedOff = document.querySelector('span#trackIsSwitchedOff');
let roomP1 = null;
let remoteVideoTrack = null;
let startVideoBitrateGraph = null;
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
  roomP1 = await Video.connect(credsP1.token, {
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

  // Set video bitrate graph.
  startVideoBitrateGraph = setupBitrateGraph('video', 'videobitrategraph', 'videobitratecanvas');

  // Attach RemoteVideoTrack
  roomP1.on('trackSubscribed', track => {
    if(track.kind === 'video') {
      track.attach(videoEl);
      remoteVideoTrack = track;
      handleIsSwitchedOff(track.isSwitchedOff);
      stopVideoBitrateGraph = startVideoBitrateGraph(roomP1, 1000);

      switchOnOffBtn.classList.remove('disabled');
      renderDimensionsOption.classList.remove('disabled');

      remoteVideoTrack.on('switchedOff', track => {
        handleIsSwitchedOff(track.isSwitchedOff);
      });
      remoteVideoTrack.on('switchedOn', track => {
        handleIsSwitchedOff(track.isSwitchedOff);
      });
    }
  });

  // Remote Track Switch On/Off
  switchOnOffBtn.onclick = event => {
    event.preventDefault();
    if(remoteVideoTrack.isSwitchedOff) {
      switchOnOffBtn.textContent = 'Switch Off';
      switchOn(remoteVideoTrack);
    } else {
      switchOnOffBtn.textContent = 'Switch On';
      switchOff(remoteVideoTrack);
    }
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
    stopVideoBitrateGraph();
    roomP1.disconnect();
    roomP2.disconnect();
  }
}());
