'use strict';

const Prism = require('prismjs');
const Video = require('twilio-video');
const getSnippet = require('../../util/getsnippet');
const getRoomCredentials = require('../../util/getroomcredentials');
const helpers = require('./helpers');

const P1Connect = document.querySelector('input#p1-connectordisconnect');
const P2Connect = document.querySelector('input#p2-connectordisconnect');
const P1Video = document.getElementById('p1-video-preview');
const P2Video = document.getElementById('p2-video-preview');

const roomName = "room1"
let room = null;
let localTracks = null;

/*
 * Connect to or disconnect the Participant with media from the Room.
 */
function connectToOrDisconnectFromRoom(event, id, localVideoDiv, remoteVideoDiv) {
  event.preventDefault();
  return room ? disconnectFromRoom(id, localVideoDiv, remoteVideoDiv) : connectToRoom(id, localVideoDiv, remoteVideoDiv);
}

/**
 * Connect the Participant with localVideoDiv to the Room.
 */
async function connectToRoom(id, localVideoDiv, remoteVideoDiv) {
  const creds = await getRoomCredentials();

  room = await Video.connect(
    creds.token,
    { name: roomName,
      tracks: localTracks,
    }
  )

  // Local Tracks attach to DOM
  getTracks(room.localParticipant).forEach(track => {
    localVideoDiv.appendChild(track.attach());
  });

  // Remote tracks attach to DOM
  room.on('participantConnected', participant => {
    participant.on('trackSubscribed', function(track) {
      remoteVideoDiv.appendChild(track.attach());
    });
  })

  console.log('room', room);
  id.value = 'Disconnect from Room';
}

/**
 * Disconnect the Participant with media from the Room.
 */
function disconnectFromRoom(id) {
  getTracks(room.localParticipant).forEach(track => {
    track.detach().forEach(element => {
      element.remove();
    });
  });

  room.disconnect();
  room = null;

  id.value = 'Connect to Room';
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

(async function() {
  // Load the code snippet.
  const snippet = await getSnippet('./helpers.js');
  const pre = document.querySelector('pre.language-javascript');

  pre.innerHTML = Prism.highlight(snippet, Prism.languages.javascript);

  // Create tracks.
  const newDataTrack = Video.LocalDataTrack();
  const audioAndVideoTrack = await Video.createLocalTracks();

  localTracks = audioAndVideoTrack.concat(newDataTrack);

  // Connect P1
  P1Connect.addEventListener('click', event => connectToOrDisconnectFromRoom(event, P1Connect, P1Video, P2Video));

  // OPEN A NEW WINDOW

  // Connect P2 with {room: roomName, tracks: ALLTRACKSHERE} on button click
  P2Connect.addEventListener('click', event => connectToOrDisconnectFromRoom(event, P2Connect, P2Video, P1Video));

  // Attach tracks to DOM


  // Disconnect from the Room on page unload.
  window.onbeforeunload = function() {
    if (room) {
      room.disconnect();
      room = null;
    }
    room.disconnect();
  };
}());
