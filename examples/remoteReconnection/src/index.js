'use strict';

const Prism = require('prismjs');
const Video = require('twilio-video');
const getSnippet = require('../../util/getsnippet');
const getRoomCredentials = require('../../util/getroomcredentials');
const helpers = require('./helpers');

const localMedia = document.getElementById('local-media');
const remoteMedia = document.getElementById('remote-media');

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
      remoteMedia.appendChild(track.attach())
    } 
  })
  
  // roomP2.on('trackSubscribed', track => {
  //   if (track.isEnabled) {
  //     localMedia.appendChild(track.attach())
  //   } 
  // })

  // Reconnecting state simulator button
    // Interrupts network when button is clicked
  
  // Update UI of remote and local participant when remote participants are in a reconnecting state
    roomP1.on('participantConnected', remoteParticipant => {
      // UPDATE UI OF P2/ REMOTE PARTICIPANT TO CONNECTED : GREEN COLOR
    })
    roomP1.on('participantReconnecting', remoteParticipant => {
      // UPDATE UI OF P2/ REMOTE PARTICIPANT TO RECONNECTING : ORANGE COLOR
    })
  

  // Disconnect from the Room 
  window.onbeforeunload = () => {
    roomP1.disconnect();
    roomP2.disconnect();
    roomName = null;
  }
}())