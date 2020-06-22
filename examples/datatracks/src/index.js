'use strict';

const Prism = require('prismjs');
const Video = require('twilio-video');
const getSnippet = require('../../util/getsnippet');
const getRoomCredentials = require('../../util/getroomcredentials');

const {
  sendChatMessage,
  receiveChatMessages,
  connectToRoomWithDataTrack,
} = require('./helpers');

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

let roomName = 'Chat1';
let roomP1 = null;
let roomP2 = null;

/*
 * Connect to or disconnect the Participant with media from the Room.
 */
async function connectToOrDisconnectFromRoom(event, id, room, roomName) {
  event.preventDefault();
  return room
    ? disconnectFromRoom(id, room)
    : await connectToRoom(id, roomName);
}

/**
 * Connect the Participant with localVideoDiv to the Room.
 */
async function connectToRoom(id, roomName) {
  const creds = await getRoomCredentials();
  const room = await connectToRoomWithDataTrack(creds.token, roomName);
  id.value = 'Disconnect from Room';
  return room;
}

/**
 * Disconnect the Participant with media from the Room.
 */
function disconnectFromRoom(id, room) {
  room.disconnect();
  id.value = 'Connect to Room';
  room = null;
  return room;
}

/**
 * Creates messages for the chat log
 */
function createMessages(fromName, message) {
  const pElement = document.createElement('p');
  pElement.className = 'text';
  pElement.classList.add(`${fromName}`);
  pElement.innerText = `${fromName}: ${message}`;
  return pElement;
}

(async function() {
  // Load the code snippet.
  const snippet = await getSnippet('./helpers.js');
  const pre = document.querySelector('pre.language-javascript');

  pre.innerHTML = Prism.highlight(snippet, Prism.languages.javascript);

  // Disabling Submit buttons until after a Participant connects to a room with published data tracks
  P1Submit.disabled = true;
  P2Submit.disabled = true;

  let P1localDataTrack = null;

  // P1 Submit Click Handler
  function P1SubmitHandler(event) {
    event.preventDefault();
    const msg = p1MsgText.value;
    p1Form.reset();
    p1ChatLog.appendChild(createMessages('P1', msg));
    sendChatMessage(P1localDataTrack, msg);
    p1ChatLog.scrollTop = p1ChatLog.scrollHeight;
  }

  // P1 sends a text message over the Data Track
  P1Submit.addEventListener('click', P1SubmitHandler);

  // Connect P1
  P1Connect.addEventListener('click', async event => {
    event.preventDefault();

    // Appends text to DOM
    function appendText(text) {
      p1ChatLog.appendChild(createMessages('P2', text));
      p1ChatLog.scrollTop = p1ChatLog.scrollHeight;
    }

    // Connect P1 to Room
    let room = await connectToOrDisconnectFromRoom(
      event,
      P1Connect,
      roomP1,
      roomName
    );

    if (room) {
      roomP1 = room;
    } else {
      roomP1 = null;
      P1localDataTrack = null;
      P1Submit.disabled = true;
    }

    if (roomP1) {
      // Once the Data Track has been published, set the P1localDataTrack for use
      roomP1.localParticipant.on('trackPublished', publication => {
        if (publication.track.kind === 'data') {
          P1localDataTrack = publication.track;
          P1Submit.disabled = false;
        }
      });

      // P1 to announce connected RemoteParticipants
      roomP1.on('participantConnected', participant => {
        appendText('has connected');
      });

      // P1 Subscribe to tracks published by remoteParticipants and append them
      receiveChatMessages(roomP1, appendText);

      // P1 to announce disconnected RemoteParticipants.
      roomP1.on('participantDisconnected', participant => {
        appendText('has disconnected');
      });
    }
  });

  let P2localDataTrack = null;

  // P2 Submit Click Handler
  function P2SubmitHandler(event) {
    event.preventDefault();
    const msg = p2MsgText.value;
    p2Form.reset();
    p2ChatLog.appendChild(createMessages('P2', msg));
    sendChatMessage(P2localDataTrack, msg);
    p2ChatLog.scrollTop = p2ChatLog.scrollHeight;
  }

  // P2 sends a text message over the Data Track
  P2Submit.addEventListener('click', P2SubmitHandler);

  // Connect P2
  P2Connect.addEventListener('click', async event => {
    event.preventDefault();

    // Appends text to DOM
    function appendText(text) {
      p2ChatLog.appendChild(createMessages('P1', text));
      p2ChatLog.scrollTop = p2ChatLog.scrollHeight;
    }

    let room = await connectToOrDisconnectFromRoom(
      event,
      P2Connect,
      roomP2,
      roomName
    );

    if (room) {
      roomP2 = room;
    } else {
      roomP2 = null;
      P2localDataTrack = null;
      P2Submit.disabled = true;
    }

    if (roomP2) {
      // Once the Data Track has been published, set the P2localDataTrack for use
      roomP2.localParticipant.on('trackPublished', publication => {
        if (publication.track.kind === 'data') {
          P2localDataTrack = publication.track;
          P2Submit.disabled = false;
        }
      });

      // P2 to announce connected RemoteParticipants
      roomP2.on('participantConnected', participant => {
        appendText('has connected');
      });

      // P2 Subscribe to tracks published by remoteParticipants and append them
      receiveChatMessages(roomP2, appendText);

      // P2 to handle disconnected RemoteParticipants.
      roomP2.on('participantDisconnected', participant => {
        appendText('has disconnected');
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
})();
