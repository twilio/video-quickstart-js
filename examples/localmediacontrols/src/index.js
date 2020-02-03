'use strict';

const Prism = require('prismjs');
const Video = require('twilio-video');
const getSnippet = require('../../util/getsnippet');
const getRoomCredentials = require('../../util/getroomcredentials');
const helpers = require('./helpers');
const muteAudio = helpers.muteAudio;
const muteVideo = helpers.muteVideo;

const audioPreview = document.getElementById('audiopreview');
const videoPreview = document.getElementById('videopreview');
const muteAudioBtn = document.getElementById('muteAudioBtn');
const muteVideoBtn = document.getElementById('muteVideoBtn');
const unmuteAudioBtn = document.getElementById('unmuteAudioBtn');
const unmuteVideoBtn = document.getElementById('unmuteVideoBtn');
let roomName = null;

(async function(){
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
  roomName = roomP1.name;

  // Connecting remote participants.
  const roomP2 = await Video.connect(credsP2.token, {
    name: roomName,
    tracks: []
  });

  // Muting audio track and video tracks click handlers
  muteAudioBtn.onclick = () => {
    const mute = muteAudioBtn.style.display === 'flex'
    const localUser = roomP1.localParticipant;

    muteAudio(localUser, mute);

    if (mute) {
      muteAudioBtn.style.display = 'none'
      unmuteAudioBtn.style.display = 'flex'
    } else {
      muteAudioBtn.style.display = 'flex'
      unmuteAudioBtn.style.display = 'none'
    }
  }

  unmuteAudioBtn.onclick = () => {
    const mute = !unmuteAudioBtn.style.display === 'flex'
    const localUser = roomP1.localParticipant;

    muteAudio(localUser, mute);

    if (!mute) {
      unmuteAudioBtn.style.display = 'none'
      muteAudioBtn.style.display = 'flex'
    } else {
      unmuteAudioBtn.style.display = 'flex'
      muteAudioBtn.style.display = 'none'
    }
  }
  
  muteVideoBtn.onclick = () => {
    const mute = muteVideoBtn.style.display === 'flex'
    const localUser = roomP1.localParticipant;

    muteVideo(localUser, mute);

    if (mute) {
      muteVideoBtn.style.display = 'none'
      unmuteVideoBtn.style.display = 'flex'
    } else {
      muteVideoBtn.style.display = 'flex'
      unmuteVideoBtn.style.display = 'none'
    }
  }

  unmuteVideoBtn.onclick = () => {
    const mute = !unmuteVideoBtn.style.display === 'flex'
    const localUser = roomP1.localParticipant;

    muteVideo(localUser, mute);

    if (!mute) {
      unmuteVideoBtn.style.display = 'none'
      muteVideoBtn.style.display = 'flex'
    } else {
      unmuteVideoBtn.style.display = 'flex'
      muteVideoBtn.style.display = 'none'
    }
  }

  // Starts video upon P2 joining room
  roomP2.on('trackSubscribed', (track => {
    if(track.isEnabled) {
      if(track.kind === 'audio') {
        audioPreview.appendChild(track.attach());
      }else{
        videoPreview.appendChild(track.attach());
      }
    }

    track.on('enabled', () => {
      if (track.kind === 'audio') {
        audioPreview.appendChild(track.attach())
      }
      if (track.kind === 'video') {
        videoPreview.appendChild(track.attach())
      }
    });

    track.on('disabled', () => {
      track.detach().forEach(element => {
        element.remove();
      });
    });
  }));

  // Disconnect from the Room 
  window.onbeforeunload = () => {
    roomP1.disconnect();
    roomP2.disconnect();
    roomName = null;
  }
}());