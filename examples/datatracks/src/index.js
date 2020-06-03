'use strict';

const Prism = require('prismjs');
const Video = require('twilio-video');
const getSnippet = require('../../util/getsnippet');
const getRoomCredentials = require('../../util/getroomcredentials');
const {subscribeDataTrack, sendData, receiveData} = require('./helpers');

const P1Connect = document.querySelector('input#p1-connectordisconnect');
const P2Connect = document.querySelector('input#p2-connectordisconnect');
const p1ChatLog = document.getElementById('p1-chat-log');
const p2ChatLog = document.getElementById('p2-chat-log');
const p1MsgText = document.getElementById('p1-usermsg');
const p2MsgText = document.getElementById('p2-usermsg');
const P1Submit = document.getElementById('P1-msg-submit');
const P2Submit = document.getElementById('P2-msg-submit');


const roomName = "room1"
let roomP1 = null;
let roomP2 = null;
let newDataTrack = null;

/*
 * Connect to or disconnect the Participant with media from the Room.
 */
async function connectToOrDisconnectFromRoom(event, id, room) {
  event.preventDefault();
  return room ? disconnectFromRoom(id, room) : await connectToRoom(id);
}

/**
 * Connect the Participant with localVideoDiv to the Room.
 */
async function connectToRoom(id) {
  const creds = await getRoomCredentials();

  const room = await Video.connect(
    creds.token,
    { name: roomName,
      tracks: [newDataTrack],
    }
  )

  id.value = 'Disconnect from Room';
  return room;
}

/**
 * Disconnect the Participant with media from the Room.
 */
function disconnectFromRoom(id, room) {
  room.disconnect();

  id.value = 'Connect to Room';
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

  // Create new Data track.
  newDataTrack = new Video.LocalDataTrack();

  // Connect P1
  P1Connect.addEventListener('click', async event => {
    roomP1 = await connectToOrDisconnectFromRoom(event, P1Connect, roomP1);

    // Attach local P1 Data Tracks to DOM
    getTracks(roomP1.localParticipant).forEach(track => {
      p1ChatLog.appendChild(track.attach());
    });

    // P1 Subscribe to tracks published by remoteParticipants
    subscribeDataTrack(roomP1, p1ChatLog);

    // P1 sends a text message over the Data Track
    P1Submit.addEventListener('click', event => {
      event.preventDefault();
      const msg = p1MsgText.value
      sendData(roomP1, msg);
    });

    // P1 Subscribe to tracks published by remoteParticipants who join in the future
    roomP1.on('participantConnected', participant => {
      receiveData(participant);
    });

    // P1 to handle disconnected RemoteParticipants.
    roomP1.on('participantDisconnected', participant => {
      getTracks(participant).forEach(track => {
        track.detach().forEach(element => {
          element.remove();
        });
      });
    });
  });

  // Connect P2
  P2Connect.addEventListener('click', async event => {
    roomP2 = await connectToOrDisconnectFromRoom(event, P2Connect);

    // Attach local Data Tracks to DOM
    getTracks(roomP2.localParticipant).forEach(track => {
      p2ChatLog.appendChild(track.attach());
    });

    // P2 Subscribe to tracks published by remoteParticipants
    subscribeDataTrack(roomP2, p2ChatLog);

    // P2 Subscribe to tracks published by remoteParticipants who join in the future
    roomP2.on('participantConnected', participant => {
      receiveData(participant);
    });

    // P2 sends a text message over the Data Track
    P2Submit.addEventListener('click', event => {
      event.preventDefault();
      const msg = p2MsgText.value
      sendData(roomP2, msg);
    })

    // P2 to handle disconnected RemoteParticipants.
    roomP2.on('participantDisconnected', participant => {
      getTracks(participant).forEach(track => {
        track.detach().forEach(element => {
          element.remove();
        });
      });
    });
  });

  // Disconnect from the Room on page unload.
  window.onbeforeunload = function() {
    if (roomP1) {
      roomP1.disconnect();
      roomP1 = null;
    }
    if (roomP2) {
      roomP2.disconnect();
      roomP2 = null;
    }
  };
}());
