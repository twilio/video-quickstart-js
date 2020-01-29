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
    const track = getTracks(localUser);
    const audioTrack = track[1];

    if (mute) {
      audioTrack.disable();
    } else {
      audioTrack.enable();
    }

    muteAudioBtn.innerHTML = mute ? 'Unmute Audio' : 'Mute Audio';
  }

  muteVideoBtn.onclick = function() {
    const mute = muteVideoBtn.innerHTML === 'Mute Video';
    const localUser = roomP1.localParticipant;
    const track = getTracks(localUser);
    const videoTrack = track[0];

    if (mute) {
      console.log('muted')
      videoTrack.disable();
    } else {
      console.log('unmuted')
      videoTrack.enable();
    }

    muteVideoBtn.innerHTML = mute ? 'Unmute Video' : 'Mute Video';
  }

  // Starts video upon P2 joining room
  roomP2.on('trackSubscribed', function(track) {
    videoPreview.appendChild(track.attach());
  })
  
}());