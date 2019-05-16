'use strict';

const Prism = require('prismjs');
const Video = require('twilio-video');
const getRoomCredentials = require('../../util/getroomcredentials');
const getSnippet = require('../../util/getsnippet');
const helpers = require('./helpers');
const waveform = require('../../util/waveform');
const connectWithPreferredCodecs = helpers.connectWithPreferredCodecs;

const connectOrDisconnect = document.querySelector('input#connectordisconnect');
const audioCodecSelector = document.querySelector('select#preferredaudiocodec');
const audioPreview = document.querySelector('audio#audiopreview');
const selectedAudioCodec = document.querySelector('span#selectedaudiocodec');
const videoCodecSelector = document.querySelector('select#preferredvideocodec');
const videoPreview = document.querySelector('video#videopreview');
const selectedVideoCodec = document.querySelector('span#selectedvideocodec');
const waveformContainer = document.querySelector('div#audiowaveform');
let roomName = null;
let room = null;

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
 * Attach a Track to its HTMLMediaElement.
 */
function attachTrack(audioElement, videoElement, showAppliedCodec, track) {
  showAppliedCodec(track.kind);
  if (track.kind === 'audio') {
    attachAudioTrack(track, audioElement);
    return;
  }
  track.attach(videoElement);
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
 * Detach a Track from its HTMLMediaElement.
 */
function detachTrack(audioElement, videoElement, track) {
  hideAppliedCodec(track.kind);
  if (track.kind === 'audio') {
    detachAudioTrack(track, audioElement);
    return;
  }
  track.detach(videoElement);
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
  const preferredAudioCodecs = audioCodecSelector.value
    ? [audioCodecSelector.value]
    : [];
  const preferredVideoCodecs = videoCodecSelector.value
    ? [videoCodecSelector.value]
    : [];
  const creds = await getRoomCredentials();

  room = await connectWithPreferredCodecs(
    creds.token,
    roomName,
    preferredAudioCodecs,
    preferredVideoCodecs);

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
 * Hide the codec used to encode the media of a particular kind in a Room.
 */
function hideAppliedCodec(kind) {
  const selectedCodec = kind === 'audio'
    ? selectedAudioCodec
    : selectedVideoCodec;
  selectedCodec.parentNode.classList.add('hidden');
}

/**
 * Show the codec used to encode the media of a particular kind in a Room.
 */
async function showAppliedCodec(room, kind) {
  // Codec stats are not immediately populated. So we wait
  // a little while until they are.
  await wait(3000);

  const stats = await room.getStats();
  const remoteStats = kind === 'audio'
    ? stats[0].remoteAudioTrackStats[0]
    : stats[0].remoteVideoTrackStats[0];
  const selectedCodec = kind === 'audio'
    ? selectedAudioCodec
    : selectedVideoCodec;
  selectedCodec.innerText = remoteStats.codec || 'Unknown';
  selectedCodec.parentNode.classList.remove('hidden');
}

/**
 * Wait for a given amount of time (ms).
 */
function wait(ms) {
  return new Promise(function(resolve) {
    setTimeout(resolve, ms);
  });
}

(async function() {
  // Load the code snippet.
  const snippet = await getSnippet('./helpers.js');
  const pre = document.querySelector('pre.language-javascript');
  pre.innerHTML = Prism.highlight(snippet, Prism.languages.javascript);

  // Set listener to the connect or disconnect button.
  connectOrDisconnect.onclick = connectToOrDisconnectFromRoom;

  // Get the credentials to connect to the Room.
  const creds = await getRoomCredentials();

  // Connect to a random Room with no media. This Participant will
  // display the media of the second Participant that will enter
  // the Room with preferred codecs.
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

  // Attach the newly subscribed Track to the DOM.
  someRoom.on('trackSubscribed', attachTrack.bind(
    null,
    audioPreview,
    videoPreview,
    showAppliedCodec.bind(null, someRoom)));

  // Detach the unsubscribed Track from the DOM.
  someRoom.on('trackUnsubscribed', detachTrack.bind(
    null,
    audioPreview,
    videoPreview));

  // Detach Participant's Tracks upon disconnect.
  someRoom.on('participantDisconnected', function(participant) {
    getTracks(participant).forEach(detachTrack.bind(
      null,
      audioPreview,
      videoPreview));
  });
}());
