'use strict';

const Prism = require('prismjs');
const Video = require('twilio-video');
const getSnippet = require('../../util/getsnippet');
const getRoomCredentials = require('../../util/getroomcredentials');
const helpers = require('./helpers');
const remoteReconnectionUpdates = helpers.remoteReconnectionUpdates;

const p1Media = document.getElementById('p1-media');
const P1simulateReconnection = document.getElementById('p1-simulate-reconnection');


// Update UI to indicate remote side room state changes
const onRoomStateChange = (participant, newState) => {
  const oldRoomState = document.querySelector(`#${participant} div.current`)
  if (oldRoomState) {
    oldRoomState.classList.remove('current');
  }

  const newRoomState = document.querySelector(`#${participant} div.${newState}`)
  newRoomState.classList.add('current');
}

(async function() {
  // Load the code snippet.
  const snippet = await getSnippet('./helpers.js');
  const pre = document.querySelector('pre.language-javascript');
  
  pre.innerHTML = Prism.highlight(snippet, Prism.languages.javascript);

  // Get the credentials to connect to the Room.
  const credsP1 = await getRoomCredentials();
  const credsP2 = await getRoomCredentials();

  // Create room instance and name for participants to join.
  const roomP1 = await Video.connect(credsP1.token);
  
  // Set room name for participant 2 to join.
  const roomName = roomP1.name;

  // Connecting remote participants.
  const roomP2 = await Video.connect(credsP2.token, {
    name: roomName
  });

  // Appends video/audio tracks when each participant is subscribed.
  roomP1.on('trackSubscribed', track => {
    if (track.isEnabled) {
      p1Media.appendChild(track.attach());
    } 
  });


  // Remote room listening on remote participant's (P1) reconnection state
  roomP2.on('participantReconnecting', remoteParticipant => {
    remoteReconnectionUpdates(roomP2, () => {
      onRoomStateChange('p2', remoteParticipant.state);
    });
  });

  // Local room listening on it's own reconnection state
  roomP1.on('reconnecting', () => {
    remoteReconnectionUpdates(roomP1, () => {
      onRoomStateChange('p1', roomP1.state);
    });
  });

  // Simulate reconnection button functionalities
  P1simulateReconnection.onclick = () => {
    roomP1._signaling._transport._twilioConnection._close({ code: 4999, reason: 'simulate-reconnect', region: 'au1' });
  }

  // Disconnect from the Room 
  window.onbeforeunload = () => {
    roomP1.disconnect();
    roomP2.disconnect();
    roomName = null;
  }
}());
