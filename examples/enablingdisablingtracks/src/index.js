'use strict';


const Prism = require('prismjs');
const Video = require('twilio-video');
const getSnippet = require('../../util/getsnippet');
const getRoomCredentials = require('../../util/getroomcredentials');
const helpers = require('./helpers');
const muteAudio = helpers.muteAudio;

let roomName = null;
const audioPreview = document.getElementById('audiopreview');
const videoPreview = document.getElementById('videopreview');
const P1Controls = document.getElementById('userControls')

// Connect participant 1, displaying audio/video
async function connectToRoom(creds) {
  const room = await Video.connect(creds.token, {
    name: roomName
  });
  return room;
}

// Get the Tracks of the given Participant.

function getTracks(participant) {
  return Array.from(participant.tracks.values()).filter(function(publication) {
    return publication.track;
  }).map(function(publication) {
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

// Connect participant 2, listening to audio/video

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
  
  // Creating mute buttons
  const muteAudioBtn = createButton('Mute Audio', P1Controls);
  const muteVideoBtn = createButton('Mute Video', P1Controls);

  // Muting audio track and video tracks

  muteAudioBtn.onclick = function() {
    const mute = muteAudioBtn.innerHTML === 'Mute Audio';
    const localUser = roomP1.localParticipant;

    getTracks(localUser).forEach(function(track) {
      if (track.kind === 'audio') {
        if (mute) {
          track.disable();
        } else {
          track.enable();
        }
      }
    });

    muteAudioBtn.innerHTML = mute ? 'Unmute Audio' : 'Mute Audio';
  }

  muteVideoBtn.onclick = function() {
    const mute = muteVideoBtn.innerHTML === 'Mute Video';
    const localUser = roomP1.localParticipant;

    getTracks(localUser).forEach(function(track) {
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
  roomP2.on('trackSubscribed', function(track) {
    let muteImage = document.createElement('img');
    muteImage.src = 'https://cdn3.iconfinder.com/data/icons/multimedia-and-media-player-solid/48/Artboard_4-512.png';

    let unmuteImage = document.createElement('img');
    unmuteImage.src = 'https://cdn0.iconfinder.com/data/icons/website-fat-outlines-part-1-black/96/web-01-512.png';

    videoPreview.appendChild(track.attach());
    // audioPreview.appendChild(unmuteImage)

    track.on('enabled', () => {
      if (track.kind === 'audio') {
        console.log('unmute audio')
        // audioPreview.replaceChild(unmuteImage, muteImage)
      }
      if (track.kind === 'video') {
        console.log('unmute video')
        // videoPreview.replaceChild(track.attach(), muteImage);
      }
    });

    track.on('disabled', () => {
      if (track.kind === 'audio') {
        console.log('mute audio')
        // audioPreview.replaceChild(muteImage, unmuteImage)
      }
      if (track.kind === 'video') {
        console.log('mute video')
        // videoPreview.replaceChild(muteImage, track.attach());
      }
    });
  });

}());