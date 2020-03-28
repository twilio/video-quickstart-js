'use strict';

const Prism = require('prismjs');
const Video = require('twilio-video');
const getRoomCredentials = require('../../util/getroomcredentials');
const getSnippet = require('../../util/getsnippet');
const helpers = require('./helpers');
const setupReconnectionUpdates = helpers.setupReconnectionUpdates;
const connectOrDisconnect = document.querySelector('input#connectordisconnect');
const createRoomBtn = document.querySelector('input#createRoom');

const mediaContainer = document.getElementById('remote-media');
let roomName = null;
let room = null;
let someRoom = null;

/**
 * Connect the Participant with media to the Room.
 */
async function connectToRoom() {
  const creds = await getRoomCredentials();
  room = await Video.connect( creds.token, {
    name: roomName
  });
  connectOrDisconnect.value = 'Leave Room';
}

/**
 * Disconnect the Participant with media from the Room.
 */
function disconnectFromRoom() {
  room.disconnect();
  room = null;
  connectOrDisconnect.value = 'Join Room';
  return;
}

function connectToOrDisconnectFromRoom(event) {
  event.preventDefault();
  return room ? disconnectFromRoom() : connectToRoom();
}

/**
 * update the UI to indicate room state.
 */
function onRoomStateChange(newState) {
  const oldStateBtn = document.querySelector('div.current');
  if (oldStateBtn) {
    oldStateBtn.classList.remove('current');
  }

  const newStateBtn = document.querySelector('div.' + newState);
  newStateBtn.classList.add('current');

  if (newState === 'disconnected') {
    // once disconnected room needs to be recreated.
    cleanupRoom();
  }
}

function cleanupRoom() {
  roomName = null;
  someRoom = null;
  createRoomBtn.disabled = false;
  connectOrDisconnect.disabled = true;
  connectOrDisconnect.value = 'Join Room';

  // remove all participant media nodes.
  while (mediaContainer.firstChild) {
    mediaContainer.removeChild(mediaContainer.firstChild);
  }
}

async function setupRoom() {
  try {
    // Get the credentials to connect to the Room.
    createRoomBtn.disabled = true;
    const creds = await getRoomCredentials();

    // Connect to a random Room with no media. This Participant will
    // display the media of the other Participants that will enter
    // the Room and watch for reconnection updates.
    someRoom = await Video.connect(creds.token, { tracks: [] });
    setupReconnectionUpdates(someRoom, onRoomStateChange);
    onRoomStateChange(someRoom.state);

    // Set the name of the Room to which the Participant that shares
    // media should join.
    roomName = someRoom.name;

    // set listener to connect new user to the room.
    connectOrDisconnect.disabled = false;
    connectOrDisconnect.onclick = connectToOrDisconnectFromRoom;

    // Disconnect from the Room on page unload.
    window.onbeforeunload = function() {
      someRoom.disconnect();
    };

    someRoom.on('participantConnected', function(participant) {
      const div = document.createElement('div');
      div.id = participant.sid;
      mediaContainer.appendChild(div);
      participant.on('trackSubscribed', function(track) {
        div.appendChild(track.attach());
      });
    });

    someRoom.on('participantDisconnected', function(participant) {
      const participantDiv = document.getElementById(participant.sid);
      participantDiv.parentNode.removeChild(participantDiv);
    });
  } catch (error) {
    console.log("Error while setting up room - was network turned off?", error);
    cleanupRoom();
  }
}

(async function() {
  // Load the code snippet.
  const snippet = await getSnippet('./helpers.js');
  const pre = document.querySelector('pre.language-javascript');

  pre.innerHTML = Prism.highlight(snippet, Prism.languages.javascript);

  // set listener to create new room.
  createRoomBtn.onclick = setupRoom;
  cleanupRoom();
}());
