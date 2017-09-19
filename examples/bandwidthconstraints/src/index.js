'use strict';

var DataSeries = require('../../util/timelinegraph').DataSeries;
var GraphView = require('../../util/timelinegraph').GraphView;
var Prism = require('prismjs');
var Video = require('twilio-video');
var getRoomCredentials = require('../../util/getroomcredentials');
var getSnippet = require('../../util/getsnippet');
var helpers = require('./helpers');
var waveform = require('../../util/waveform');
var connectWithBandwidthConstraints = helpers.connectWithBandwidthConstraints;
var updateBandwidthConstraints = helpers.updateBandwidthConstraints;

var connectOrDisconnect = document.querySelector('input#connectordisconnect');
var audioBitrateSelector = document.querySelector('select#maxaudiobitrate');
var audioPreview = document.querySelector('audio#audiopreview');
var videoBitrateSelector = document.querySelector('select#maxvideobitrate');
var videoPreview = document.querySelector('video#videopreview');
var waveformContainer = document.querySelector('div#audiowaveform');
var roomName = null;
var room = null;
var startAudioBitrateGraph = null;
var startVideoBitrateGraph = null;
var stopAudioBitrateGraph = null;
var stopVideoBitrateGraph = null;

/**
 * Attach the AudioTrack to the HTMLAudioElement and start the Waveform.
 */
function attachAudioTrack(track, audioElement) {
  track.attach(audioElement);
  waveform.setStream(audioPreview.srcObject);
  var canvas = waveformContainer.querySelector('canvas');
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
  var canvas = waveformContainer.querySelector('canvas');
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
 * Connect to or disconnect from a Room.
 */
function connectToOrDisconnectFromRoom(e) {
  e.preventDefault();
  if (room) {
    e.target.value = 'Connect to Room';
    room.disconnect();
    room = null;
    return;
  }
  var maxAudioBitrate = audioBitrateSelector.value
    ? Number(audioBitrateSelector.value)
    : null;
  var maxVideoBitrate = videoBitrateSelector.value
    ? Number(videoBitrateSelector.value)
    : null;

  getRoomCredentials().then(function(creds) {
    return connectWithBandwidthConstraints(
      creds.token,
      roomName,
      maxAudioBitrate,
      maxVideoBitrate);
  }).then(function(_room) {
    room = _room;
    e.target.value = 'Disconnect from Room';
  });
}

function setupBitrateGraph(kind, containerId, canvasId) {
  var bitrateSeries = new DataSeries();
  var bitrateGraph = new GraphView(containerId, canvasId);

  bitrateGraph.graphDiv_.style.display = 'none';
  return function startBitrateGraph(room, intervalMs) {
    var bytesReceived = 0;
    var timestamp = Date.now();
    var interval = setInterval(function() {
      if (!room) {
        clearInterval(interval);
        return;
      }
      room.getStats().then(function(stats) {
        var remoteTrackStats = kind === 'audio'
          ? stats[0].remoteAudioTrackStats[0]
          : stats[0].remoteVideoTrackStats[0]

        var _bytesReceived = remoteTrackStats.bytesReceived;
        var _timestamp = remoteTrackStats.timestamp;

        var bitrate = Math.round((_bytesReceived - bytesReceived) * 8 / (_timestamp - timestamp));
        bitrateSeries.addPoint(_timestamp, bitrate);
        bitrateGraph.setDataSeries([bitrateSeries]);
        bitrateGraph.updateEndDate();

        bytesReceived = _bytesReceived;
        timestamp = _timestamp;
      });
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
  var maxAudioBitrate = audioBitrateSelector.value
    ? Number(audioBitrateSelector.value)
    : null;
  var maxVideoBitrate = videoBitrateSelector.value
    ? Number(videoBitrateSelector.value)
    : null;
  updateBandwidthConstraints(room, maxAudioBitrate, maxVideoBitrate);
}

// Load the code snippet.
getSnippet('./helpers.js').then(function(snippet) {
  var pre = document.querySelector('pre.language-javascript');
  pre.innerHTML = Prism.highlight(snippet, Prism.languages.javascript);
}).then(function() {
  // Set listeners to the bandwidth selectors.
  audioBitrateSelector.onchange = updateBandwidthParametersInRoom;
  videoBitrateSelector.onchange = updateBandwidthParametersInRoom;

  // Set listener to the connect or disconnect button.
  connectOrDisconnect.onclick = connectToOrDisconnectFromRoom;

  // Set bitrate graphs.
  startAudioBitrateGraph = setupBitrateGraph('audio', 'audiobitrategraph', 'audiobitratecanvas');
  startVideoBitrateGraph = setupBitrateGraph('video', 'videobitrategraph', 'videobitratecanvas');

  // Get the credentials to connect to the Room.
  return getRoomCredentials();
}).then(function(creds) {
  // Connect to a random Room with no media. This Participant will
  // display the media of the second Participant that will enter
  // the Room with bandwidth constraints.
  return Video.connect(creds.token, { tracks: [] });
}).then(function(_room) {
  window.onbeforeunload = function() {
    if (room) {
      room.disconnect();
      room = null;
    }
    _room.disconnect();
  };

  roomName = _room.name;

  _room.on('trackAdded', attachTrack.bind(
    null,
    audioPreview,
    videoPreview,
    startAudioBitrateGraph.bind(null, _room),
    startVideoBitrateGraph.bind(null, _room)));

  _room.on('trackRemoved', detachTrack.bind(
    null,
    audioPreview,
    videoPreview));

  _room.on('participantDisconnected', function(participant) {
    participant.tracks.forEach(detachTrack.bind(null, audioPreview, videoPreview));
  });
});
