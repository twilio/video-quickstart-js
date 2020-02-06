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
    const mute = !muteAudioBtn.classList.contains('muted');
    const activeIcon = document.getElementById('activeIcon');
    const inactiveIcon = document.getElementById('inactiveIcon');

    if(mute) {
      muteYourAudio(roomP1);
      muteAudioBtn.classList.add('muted');
      muteAudioBtn.innerText = 'Unmute Audio';
      activeIcon.id = 'inactiveIcon';
      inactiveIcon.id = 'activeIcon';

    } else {
      unmuteYourAudio(roomP1);
      muteAudioBtn.classList.remove('muted');
      muteAudioBtn.innerText = 'Mute Audio';
      activeIcon.id = 'inactiveIcon';
      inactiveIcon.id = 'activeIcon';
    }
  }
  
  muteVideoBtn.onclick = () => {
    const mute = !muteVideoBtn.classList.contains('muted');
    
    if(mute) {
      muteYourVideo(roomP1);
      muteVideoBtn.classList.add('muted');
      muteVideoBtn.innerText = 'Start Video';
    } else {
      unmuteYourVideo(roomP1);
      muteVideoBtn.classList.remove('muted');
      muteVideoBtn.innerText = 'Stop Video';
    }
  }

  // Starts video upon P2 joining room
  roomP2.on('trackSubscribed', (track => {
    if (track.isEnabled) {
      if (track.kind === 'audio') {
        audioPreview.appendChild(track.attach());
      } else{
        videoPreview.appendChild(track.attach());
      }
    }

    participantMutedOrUnmutedMedia(roomP2, track => {
      track.detach().forEach(element => {
        element.remove();
      });
    }, track => {
        if (track.kind === 'audio') {
          audioPreview.appendChild(track.attach());
        }
        if (track.kind === 'video') {
          videoPreview.appendChild(track.attach());
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
