'use strict';

const Prism = require('prismjs');
const Video = require('twilio-video');
const getSnippet = require('../../util/getsnippet');
const getRoomCredentials = require('../../util/getroomcredentials');
const helpers = require('./helpers');

const audioPreview = document.getElementById('audiopreview');
const videoPreview = document.getElementById('videopreview');
const P1Controls = document.getElementById('userControls')
let roomName = null;

// Get the Tracks of the given Participant.
function getTracks(participant) {
  return Array.from(participant.tracks.values()).filter(publication => {
    return publication.track;
  }).map(publication => {
    return publication.track;
  });
}

// Creates a button
function createButton(text, container) {
  const btn = document.createElement('button');
  btn.innerHTML = text;
  btn.classList.add('btn', 'btn-outline-primary', 'btn-sm');
  container.appendChild(btn);
  return btn;
}

// Creating mute buttons
const muteAudioBtn = createButton('Mute Audio', P1Controls);
const muteVideoBtn = createButton('Mute Video', P1Controls);

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
    name:roomName,
    tracks: [],
  });

  // Muting audio track and video tracks
  muteAudioBtn.onclick = () => {
    const mute = muteAudioBtn.innerHTML === '<span class="glyphicon glyphicon-volume-off"></span> Mute Audio';
    const localUser = roomP1.localParticipant;

    getTracks(localUser).forEach(track => {
      if (track.kind === 'audio') {
        if (mute) {
          track.disable();
        } else {
          track.enable();
        }
      }
    });

    // muteAudioBtn.innerHTML = mute ? 'Unmute Audio' : 'Mute Audio';

    // console.log('audiobtn',muteAudioBtn)

    if(mute) {
      muteAudioBtn.innerHTML = '<span class="glyphicon glyphicon-volume-up"></span> Unmute Audio'
    } else {
      muteAudioBtn.innerHTML = '<span class="glyphicon glyphicon-volume-off"></span> Mute Audio'
    }
  }

  muteVideoBtn.onclick = () => {
    const mute = muteVideoBtn.innerHTML === 'Mute Video';
    const localUser = roomP1.localParticipant;

    getTracks(localUser).forEach(track => {
      if (track.kind === 'video') {
        if (mute) {
          track.disable();
        } else {
          track.enable();
        }
      }
    });

    muteVideoBtn.innerHTML = mute ? 'Unmute Video' : 'Mute Video';
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