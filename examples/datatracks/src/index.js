'use strict';

const Prism = require('prismjs');
const Video = require('twilio-video');
const getSnippet = require('../../util/getsnippet');
const getRoomCredentials = require('../../util/getroomcredentials');
const {subscribeDataTrack, getDataTrackPromise, sendData, receiveData} = require('./helpers');

const P1Connect = document.querySelector('input#p1-connectordisconnect');
const P2Connect = document.querySelector('input#p2-connectordisconnect');
const p1ChatLog = document.getElementById('p1-chat-log');
const p2ChatLog = document.getElementById('p2-chat-log');
const p1MsgText = document.getElementById('p1-usermsg');
const p2MsgText = document.getElementById('p2-usermsg');
const p1Form = document.getElementById('p1-form');
const p2Form = document.getElementById('p2-form');
const P1Submit = document.getElementById('P1-msg-submit');
const P2Submit = document.getElementById('P2-msg-submit');


const roomName = "room1"
let roomP1 = null;
let roomP2 = null;

/*
 * Connect to or disconnect the Participant with media from the Room.
 */
async function connectToOrDisconnectFromRoom(event, id, room, dataTrack) {
  event.preventDefault();
  return room ? disconnectFromRoom(id, room) : await connectToRoom(id, dataTrack);
}

/**
 * Connect the Participant with localVideoDiv to the Room.
 */
async function connectToRoom(id,dataTrack) {
  const creds = await getRoomCredentials();

  const room = await Video.connect(
    creds.token,
    { name: roomName,
      tracks: [dataTrack],
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
 * Creates messages for the chat log
 */
function createMessages(fromName, message) {
  const pElement = document.createElement("p");
  pElement.className = 'text'
  pElement.innerText = `${fromName}: ${message}`;

  return pElement
}

(async function() {
  // Load the code snippet.
  const snippet = await getSnippet('./helpers.js');
  const pre = document.querySelector('pre.language-javascript');

  pre.innerHTML = Prism.highlight(snippet, Prism.languages.javascript);

  // Connect P1
  P1Connect.addEventListener('click', async event => {
    event.preventDefault();

    // Appends text to DOM
    function appendText (text) {
      p1ChatLog.appendChild(createMessages('P2', text))
    }

    // Create new Data track.
    const newDataTrack = new Video.LocalDataTrack();

    // Connect P1 to Room
    roomP1 = await connectToOrDisconnectFromRoom(event, P1Connect, roomP1, newDataTrack);

    if(roomP1) {
      // P1 Data Track Promise
      const dataTrackPromise = getDataTrackPromise(roomP1, newDataTrack);

      // P1 Subscribe to tracks published by remoteParticipants and append them
      subscribeDataTrack(roomP1, appendText);

      // P1 Subscribe to tracks published by remoteParticipants who join in the future
      roomP1.on('participantConnected', participant => {
        receiveData(participant, appendText);
      });

      // P1 sends a text message over the Data Track
      P1Submit.addEventListener('click', event => {
        event.preventDefault();
        const msg = p1MsgText.value
        p1Form.reset();

        p1ChatLog.appendChild(createMessages('P1', msg))
        dataTrackPromise.then(dataTrack => sendData(dataTrack, msg));
      });

      // P1 to handle disconnected RemoteParticipants.
      roomP1.on('participantDisconnected', participant => {
        appendText('has disconnected')
      });
    }
  });

  // Connect P2
  P2Connect.addEventListener('click', async event => {
    event.preventDefault();

    // Appends text to DOM
    function appendText (text) {
      p2ChatLog.appendChild(createMessages('P1', text))
    }

    // Create new Data track.
    const newDataTrack = new Video.LocalDataTrack();

    roomP2 = await connectToOrDisconnectFromRoom(event, P2Connect, roomP2, newDataTrack);

    if(roomP2) {
      // P2 Data Track Promise
      const dataTrackPromise = getDataTrackPromise(roomP2, newDataTrack);

      // P2 Subscribe to tracks published by remoteParticipants and append them
      subscribeDataTrack(roomP2, appendText);

      // P2 Subscribe to tracks published by remoteParticipants who join in the future
      roomP2.on('participantConnected', participant => {
        receiveData(participant, appendText);
      });

      // P2 sends a text message over the Data Track
      P2Submit.addEventListener('click', event => {
        event.preventDefault();
        const msg = p2MsgText.value
        p2Form.reset()

        p2ChatLog.appendChild(createMessages('P2', msg));
        dataTrackPromise.then(dataTrack => sendData(dataTrack, msg));
      })

      // P2 to handle disconnected RemoteParticipants.
      roomP2.on('participantDisconnected', participant => {
        appendText('has disconnected')
      });
    }
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
