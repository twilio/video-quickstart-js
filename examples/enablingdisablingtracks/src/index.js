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
const muteVideoBtn = document.getElementById('muteVideoBtn')
let roomName = null;

// Get the Tracks of the given Participant.
function getTracks(participant) {
  return Array.from(participant.tracks.values()).filter(publication => {
    return publication.track;
  }).map(publication => {
    return publication.track;
  });
}


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
    const mute = muteAudioBtn.innerHTML === '<img src="./icons/volume-mute-fill.svg"> Mute Audio';
    const localUser = roomP1.localParticipant;

    muteAudio(localUser, mute);

    if(mute) {
      muteAudioBtn.innerHTML = '<img src="./icons/volume-up-fill.svg"> Unmute Audio'
    } else {
      muteAudioBtn.innerHTML = '<img src="./icons/volume-mute-fill.svg"> Mute Audio'
    }
  }

  muteVideoBtn.onclick = () => {
    const mute = muteVideoBtn.innerHTML === '<img src="./icons/pause-fill.svg"> Mute Video';
    const localUser = roomP1.localParticipant;

    muteVideo(localUser, mute);

    if(mute) {
      muteVideoBtn.innerHTML = '<img src="./icons/play-fill.svg"> Unmute Video'
    } else {
      muteVideoBtn.innerHTML = '<img src="./icons/pause-fill.svg"> Mute Video';
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