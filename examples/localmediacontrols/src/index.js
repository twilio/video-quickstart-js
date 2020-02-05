'use strict';

const Prism = require('prismjs');
const Video = require('twilio-video');
const getSnippet = require('../../util/getsnippet');
const getRoomCredentials = require('../../util/getroomcredentials');
const helpers = require('./helpers');
const muteYourAudio = helpers.muteYourAudio;
const muteYourVideo = helpers.muteYourVideo;
const unmuteYourAudio = helpers.unmuteYourAudio;
const unmuteYourVideo = helpers.unmuteYourVideo;
const participantMutedOrUnmutedMedia = helpers.participantMutedOrUnmutedMedia;


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
    muteYourAudio(roomP1);
    muteAudioBtn.style.display = 'none';
    unmuteAudioBtn.style.display = 'flex';
  }

  unmuteAudioBtn.onclick = () => {
    unmuteYourAudio(roomP1);
    unmuteAudioBtn.style.display = 'none';
    muteAudioBtn.style.display = 'flex';
  }
  
  muteVideoBtn.onclick = () => {
    muteYourVideo(roomP1);
    muteVideoBtn.style.display = 'none';
    unmuteVideoBtn.style.display = 'flex';
  }

  unmuteVideoBtn.onclick = () => {
    unmuteYourVideo(roomP1);
    unmuteVideoBtn.style.display = 'none';
    muteVideoBtn.style.display = 'flex';
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

    participantMutedOrUnmutedMedia(roomP2, track => {
      track.detach().forEach(element => {
        element.remove();
      })}, track => {
        if (track.kind === 'audio') {
          audioPreview.appendChild(track.attach())
        }
        if (track.kind === 'video') {
          videoPreview.appendChild(track.attach())
        }
      });
  }));

  // Disconnect from the Room 
  window.onbeforeunload = () => {
    roomP1.disconnect();
    roomP2.disconnect();
    roomName = null;
  }
}());
