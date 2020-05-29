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
let roomP1 = null;
let roomP2 = null;

let newDataTrack;

/*
 * Connect to or disconnect the Participant with media from the Room.
 */
function connectToOrDisconnectFromRoom(event, id, room) {
  event.preventDefault();
  return room ? disconnectFromRoom(id, room) : connectToRoom(id, room);
}

/**
 * Connect the Participant with localVideoDiv to the Room.
 */
async function connectToRoom(id, room) {
  const creds = await getRoomCredentials();

  room = await Video.connect(
    creds.token,
    { name: roomName,
      tracks: [newDataTrack],
    }
  )

  id.value = 'Disconnect from Room';
}

/**
 * Disconnect the Participant with media from the Room.
 */
function disconnectFromRoom(id, room) {
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
  newDataTrack = Video.LocalDataTrack();

  // Connect P1
  P1Connect.addEventListener('click', event => connectToOrDisconnectFromRoom(event, P1Connect, roomP1));

  // Attach tracks to DOM

  // P1 Subscribe to tracks published by remoteParticipants
  roomP1.participants.forEach(participant => {
    participant.tracks.forEach(publication => {
      publication.on('subscribed', track => {
        P2Video.appendChild(track.attach());
      });
    });
  });

    // P1 Subscribe to tracks published by remoteParticipants who join in the future
  roomP1.on('participantConnected', participant => {
    participant.on('trackSubscribed', track => {
      P2Video.appendChild(track.attach());
    });
  })

  // P1 to handle disconnected RemoteParticipants.
  roomP1.on('participantDisconnected', participant => {
    getTracks(participant).forEach(track => {
      track.detach().forEach(element => {
        element.remove();
      });
    });
  });

  // Connect P2
  P2Connect.addEventListener('click', event => connectToOrDisconnectFromRoom(event, P2Connect, roomP2));

  // P2 Subscribe to tracks published by remoteParticipants
  roomP2.participants.forEach(participant => {
    participant.tracks.forEach(publication => {
      publication.on('subscribed', track => {
        P1Video.appendChild(track.attach());
      });
    });
  });

    // P2 Subscribe to tracks published by remoteParticipants who join in the future
  roomP2.on('participantConnected', participant => {
    participant.on('trackSubscribed', track => {
      P1Video.appendChild(track.attach());
    });
  })

  // P2 to handle disconnected RemoteParticipants.
  roomP2.on('participantDisconnected', participant => {
    getTracks(participant).forEach(track => {
      track.detach().forEach(element => {
        element.remove();
      });
    });
  });



  // Disconnect from the Room on page unload.
  // window.onbeforeunload = function() {
  //   if (room) {
  //     room.disconnect();
  //     room = null;
  //   }
  //   room.disconnect();
  // };
}());
