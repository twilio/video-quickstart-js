'use strict';

const Prism = require('prismjs');
const Video = require('twilio-video');
const getSnippet = require('../../util/getsnippet');
const getRoomCredentials = require('../../util/getroomcredentials');
const helpers = require('./helpers');
const remoteReconnectionStates = helpers.remoteReconnectionUpdates;

const localMedia = document.getElementById('local-media');
const remoteMedia = document.getElementById('remote-media');
const P1simulateReconnection = document.getElementById('p1-simulate-reconnection');
const P2simulateReconnection = document.getElementById('p2-simulate-reconnection');

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
      remoteMedia.appendChild(track.attach());
    } 
  });
  
  roomP2.on('trackSubscribed', track => {
    if (track.isEnabled) {
      localMedia.appendChild(track.attach());
    } 
  });

  // Simulate reconnection button functionalities
  P1simulateReconnection.onclick = () => {
    // On click this button should interrupt network activities for P1.
    // Participant 2 will listen to P1 going into reconnect state.
    // Change UI according to state
    roomP1._signaling._transport._twilioConnection._close({ code: 4999, reason: 'simulate-reconnect' });
    console.log('reconnection simulate')
  }

  // P2simulateReconnection.onclick = () => {
  //   roomP2._signaling._transport._twilioConnection._close({ code: 5000, reason: 'simulate-reconnect' });
  // }

  // Update UI of remote and local participant when remote participants are in a reconnecting state
  remoteReconnectionStates(roomP2, () => {
    
  })

  // Disconnect from the Room 
  window.onbeforeunload = () => {
    roomP1.disconnect();
    roomP2.disconnect();
    roomName = null;
  }
}());
