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
  const credsLocal = await getRoomCredentials();
  const credsRemote = await getRoomCredentials();

  // Create room instance and name for participants to join.
  const roomLocal = await Video.connect(credsLocal.token);
  
  // Set room name for participant 2 to join.
  const roomName = roomLocal.name;

  // Connecting remote participants.
  const roomRemote = await Video.connect(credsRemote.token, {
    name: roomName
  });

  // Appends video/audio tracks when each participant is subscribed.
  roomLocal.on('trackSubscribed', track => {
    if (track.isEnabled) {
      remoteMedia.appendChild(track.attach())
    } 
  })
  
  roomRemote.on('trackSubscribed', track => {
    if (track.isEnabled) {
      localMedia.appendChild(track.attach())
    } 
  })

  // Reconnecting state simulator button


  // Disconnect from the Room 
  window.onbeforeunload = () => {
    roomLocal.disconnect();
    roomRemote.disconnect();
    roomName = null;
  }
}())