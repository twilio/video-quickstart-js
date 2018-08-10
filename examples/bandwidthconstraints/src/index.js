'use strict';

const DataSeries = require('../../util/timelinegraph').DataSeries;
const GraphView = require('../../util/timelinegraph').GraphView;
const Prism = require('prismjs');
const Video = require('twilio-video');
const getRoomCredentials = require('../../util/getroomcredentials');
const getSnippet = require('../../util/getsnippet');
const helpers = require('./helpers');
const waveform = require('../../util/waveform');
const connectWithBandwidthConstraints = helpers.connectWithBandwidthConstraints;
const updateBandwidthConstraints = helpers.updateBandwidthConstraints;

const connectOrDisconnect = document.querySelector('input#connectordisconnect');
const audioBitrateSelector = document.querySelector('select#maxaudiobitrate');
const audioPreview = document.querySelector('audio#audiopreview');
const videoBitrateSelector = document.querySelector('select#maxvideobitrate');
const videoPreview = document.querySelector('video#videopreview');
const waveformContainer = document.querySelector('div#audiowaveform');
let roomName = null;
let room = null;
let startAudioBitrateGraph = null;
let startVideoBitrateGraph = null;
let stopAudioBitrateGraph = null;
let stopVideoBitrateGraph = null;

/**
 * Attach the AudioTrack to the HTMLAudioElement and start the Waveform.
 */
function attachAudioTrack(track, audioElement) {
  track.attach(audioElement);
  waveform.setStream(audioPreview.srcObject);
  const canvas = waveformContainer.querySelector('canvas');
  if (!canvas) {
    waveformContainer.appendChild(waveform.element);
  }
}

/**
 * Attach a Track to one of the HTMLMediaElements and start the bitrate graph.
 */
function attachTrack(audioElement, videoElement, starAudioBitrateGraph, startVideoBitrateGraph, track) {
  if (track.kind === 'audio') {
    attachAudioTrack(track, audioElement);
    stopAudioBitrateGraph = starAudioBitrateGraph(1000);
    return;
  }
  track.attach(videoElement);
  stopVideoBitrateGraph = startVideoBitrateGraph(1000);
}

/**
 * Detach the AudioTrack from the HTMLAudioElement and stop the Waveform.
 */
function detachAudioTrack(track, audioElement) {
  track.detach(audioElement);
  waveform.unsetStream();
  const canvas = waveformContainer.querySelector('canvas');
  if (canvas) {
    canvas.remove();
  }
}

/**
 * Detach a Track from its HTMLMediaElement and stop the bitrate graph.
 */
function detachTrack(audioElement, videoElement, track) {
  if (track.kind === 'audio') {
    detachAudioTrack(track, audioElement);
    stopAudioBitrateGraph();
    return;
  }
  track.detach(videoElement);
  stopVideoBitrateGraph();
}

/**
 * Connect to or disconnect the Participant with media from the Room.
 */
function connectToOrDisconnectFromRoom(event) {
  event.preventDefault();
  return room ? disconnectFromRoom() : connectToRoom();
}

/**
 * Connect the Participant with media to the Room.
 */
async function connectToRoom() {
  const maxAudioBitrate = audioBitrateSelector.value
    ? Number(audioBitrateSelector.value)
    : null;
  const maxVideoBitrate = videoBitrateSelector.value
    ? Number(videoBitrateSelector.value)
    : null;
  const creds = await getRoomCredentials();

  room = await connectWithBandwidthConstraints(
    creds.token,
    roomName,
    maxAudioBitrate,
    maxVideoBitrate);

  connectOrDisconnect.value = 'Disconnect from Room';
}

/**
 * Disconnect the Participant with media from the Room.
 */
function disconnectFromRoom() {
  room.disconnect();
  room = null;
  connectOrDisconnect.value = 'Connect to Room';
  return;
}

/**
 * Get the Tracks of the given Participant.
 */
function getTracks(participant) {
  return Array.from(participant.tracks.values()).filter(function(publication) {
    return publication.track;
  }).map(function(publication) {
    return publication.track;
  });
}

/**
 * Set up the bitrate graph for audio or video media.
 */
function setupBitrateGraph(kind, containerId, canvasId) {
  const bitrateSeries = new DataSeries();
  const bitrateGraph = new GraphView(containerId, canvasId);

  bitrateGraph.graphDiv_.style.display = 'none';
  return function startBitrateGraph(room, intervalMs) {
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

/**
 * Update bandwidth constraints in the Room.
 */
function updateBandwidthParametersInRoom() {
  if (!room) {
    return;
  }
  const maxAudioBitrate = audioBitrateSelector.value
    ? Number(audioBitrateSelector.value)
    : null;
  const maxVideoBitrate = videoBitrateSelector.value
    ? Number(videoBitrateSelector.value)
    : null;
  updateBandwidthConstraints(room, maxAudioBitrate, maxVideoBitrate);
}

(async function() {
  // Load the code snippet.
  const snippet = await getSnippet('./helpers.js');
  const pre = document.querySelector('pre.language-javascript');
  pre.innerHTML = Prism.highlight(snippet, Prism.languages.javascript);

  // Set listeners to the bandwidth selectors.
  audioBitrateSelector.onchange = updateBandwidthParametersInRoom;
  videoBitrateSelector.onchange = updateBandwidthParametersInRoom;

  // Set listener to the connect or disconnect button.
  connectOrDisconnect.onclick = connectToOrDisconnectFromRoom;

  // Set bitrate graphs.
  startAudioBitrateGraph = setupBitrateGraph('audio', 'audiobitrategraph', 'audiobitratecanvas');
  startVideoBitrateGraph = setupBitrateGraph('video', 'videobitrategraph', 'videobitratecanvas');

  // Get the credentials to connect to the Room.
  const creds = await getRoomCredentials();

  // Connect to a random Room with no media. This Participant will
  // display the media of the second Participant that will enter
  // the Room with bandwidth constraints.
  const someRoom = await Video.connect(creds.token, { tracks: [] });

  // Disconnect from the Room on page unload.
  window.onbeforeunload = function() {
    if (room) {
      room.disconnect();
      room = null;
    }
    someRoom.disconnect();
  };

  // Set the name of the Room to which the Participant that shares
  // media should join.
  roomName = someRoom.name;

  // Attach the newly subscribed Track to the DOM and start the bitrate graph.
  someRoom.on('trackSubscribed', attachTrack.bind(
    null,
    audioPreview,
    videoPreview,
    startAudioBitrateGraph.bind(null, someRoom),
    startVideoBitrateGraph.bind(null, someRoom)));

  // Detach the unsubscribed Track from the DOM and stop the bitrate graph.
  someRoom.on('trackUnsubscribed', detachTrack.bind(
    null,
    audioPreview,
    videoPreview));

  // Detach Participant's Tracks and stop the bitrate graphs upon disconnect.
  someRoom.on('participantDisconnected', function(participant) {
    getTracks(participant).forEach(detachTrack.bind(
      null,
      audioPreview,
      videoPreview));
  });
}());
