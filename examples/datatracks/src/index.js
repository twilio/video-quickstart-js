'use strict';

const Prism = require('prismjs');
const Video = require('twilio-video');
const getSnippet = require('../../util/getsnippet');
const getRoomCredentials = require('../../util/getroomcredentials');
const {sendChatMessage, receiveChatMessages, connectToRoomWithDataTrack} = require('./helpers');

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

let roomName = undefined;
let roomP1 = null;
let roomP2 = null;

/*
 * Connect to or disconnect the Participant with media from the Room.
 */
async function connectToOrDisconnectFromRoom(event, id, room, submitToggle) {
  event.preventDefault();
  return room ? disconnectFromRoom(id, room, submitToggle) : await connectToRoom(id, submitToggle);
}

/**
 * Connect the Participant with localVideoDiv to the Room.
 */
async function connectToRoom(id, submitToggle) {
  const creds = await getRoomCredentials();
  const room = connectToRoomWithDataTrack(creds.token, roomName);

  submitToggle.disabled = false;
  id.value = 'Disconnect from Room';
  return room;
}

/**
 * Disconnect the Participant with media from the Room.
 */
function disconnectFromRoom(id, room, submitToggle) {
  room.disconnect();
  submitToggle.disabled = true;
  id.value = 'Connect to Room';
}

/**
 * Creates messages for the chat log
 */
function createMessages(fromName, message) {
  const pElement = document.createElement("p");
  pElement.className = 'text';
  pElement.classList.add(`${fromName}`)
  pElement.innerText = `${fromName}: ${message}`;
  return pElement;
}

(async function() {
  // Load the code snippet.
  const snippet = await getSnippet('./helpers.js');
  const pre = document.querySelector('pre.language-javascript');

  pre.innerHTML = Prism.highlight(snippet, Prism.languages.javascript);

  // Disabling Submit buttons until after a Participant connects to a room
  P1Submit.disabled = true;
  P2Submit.disabled = true;

  // Connect P1
  P1Connect.addEventListener('click', async event => {
    event.preventDefault();

    // Appends text to DOM
    function appendText(text) {
      p1ChatLog.appendChild(createMessages('P2', text));
      p1ChatLog.scrollTop = p1ChatLog.scrollHeight;
    }

    // Connect P1 to Room
    const room = await connectToOrDisconnectFromRoom(event, P1Connect, roomP1, P1Submit);

    // Store Data track for future use.
    const { localDataTrack } = room;
    roomP1 = room.room;

    if(!roomName) {
      roomName = roomP1.name;
      console.log('p1 joined first, roomName', roomName, ' should match ', roomP1.name)
    }

    if(roomP1) {
      // P1 Subscribe to tracks published by remoteParticipants and append them
      receiveChatMessages(roomP1, appendText);

      // P1 sends a text message over the Data Track
      P1Submit.addEventListener('click', event => {
        event.preventDefault();
        const msg = p1MsgText.value;
        p1Form.reset();
        p1ChatLog.appendChild(createMessages('P1', msg))
        sendChatMessage(localDataTrack, msg);
        p1ChatLog.scrollTop = p1ChatLog.scrollHeight;
      });

      // P1 to handle disconnected RemoteParticipants.
      roomP1.on('participantDisconnected', participant => {
        appendText('has disconnected');
      });
    }
  });

  // Connect P2
  P2Connect.addEventListener('click', async event => {
    event.preventDefault();

    // Appends text to DOM
    function appendText(text) {
      p2ChatLog.appendChild(createMessages('P1', text));
      p2ChatLog.scrollTop = p2ChatLog.scrollHeight;
    }

    const room = await connectToOrDisconnectFromRoom(event, P2Connect, roomP2, P2Submit);

    // Store Data track for future use.
    const { localDataTrack } = room;
    roomP2 = room.room;

    if(!roomName) {
      roomName = roomP2.name;
      console.log('p2 joined first, roomName', roomName, ' should match ', roomP2.name)
    }
    console.log('p2 joined second, roomName', roomName, ' should match ', roomP2.name)

    if(roomP2) {
      // P2 Subscribe to tracks published by remoteParticipants and append them
      receiveChatMessages(roomP2, appendText);

      // P2 sends a text message over the Data Track
      P2Submit.addEventListener('click', event => {
        event.preventDefault();
        const msg = p2MsgText.value;
        p2Form.reset();
        p2ChatLog.appendChild(createMessages('P2', msg));
        sendChatMessage(localDataTrack, msg);
        p2ChatLog.scrollTop = p2ChatLog.scrollHeight;
      })

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
}());
