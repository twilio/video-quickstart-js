'use strict';

const Prism = require('prismjs');
const Video = require('twilio-video');
const getRoomCredentials = require('../../util/getroomcredentials');
const getSnippet = require('../../util/getsnippet');
const helpers = require('./helpers');
const createRoomAndUpdateOnSpeakerchange = helpers.createRoomAndUpdateOnSpeakerchange;
const connectOrDisconnect = document.querySelector('input#connectordisconnect');
const connectNewUserBtn = document.querySelector('input#connectNewUser');
let roomName = null;
let room = null;
const mediaContainer = document.getElementById('remote-media');
const userControls = document.getElementById('user-controls');


function connectNewUser(event) {
  event.preventDefault();
  connectToRoom();
}

function createUserControls(room) {
  const localUser = room.localParticipant;
  const currentUserControls = document.createElement('div');
  currentUserControls.classList.add('usercontrol');

  const title = document.createElement('h6');
  title.appendChild(document.createTextNode(localUser.identity));
  currentUserControls.appendChild(title);

  // disconnect button for the user
  const disconnectBtn = document.createElement('button');
  disconnectBtn.innerHTML = 'Disconnect';
  disconnectBtn.classList.add('btn', 'btn-outline-primary', 'btn-sm');
  disconnectBtn.onclick = function() {
    room.disconnect();
    currentUserControls.parentNode.removeChild(currentUserControls);
  }
  currentUserControls.appendChild(disconnectBtn);

  // mute button.
  const muteBtn = document.createElement('button');
  muteBtn.innerHTML = 'Mute';
  muteBtn.classList.add('btn', 'btn-outline-primary', 'btn-sm');
  muteBtn.onclick = function() {
    const mute = muteBtn.innerHTML == 'Mute';
    getTracks(localUser).forEach(function(track) {
      if (track.kind === 'audio') {
        if (mute) {
          track.disable();
        } else {
          track.enable();
        }
      }
    });
    muteBtn.innerHTML = mute ? 'Unmute' : 'Mute';
  }
  currentUserControls.appendChild(muteBtn);
  userControls.appendChild(currentUserControls);
}
/**
 * Connect the Participant with media to the Room.
 */
async function connectToRoom() {
  const creds = await getRoomCredentials();
  room = await Video.connect( creds.token, {
    name: roomName
  });

  createUserControls(room);
}

/**
 * Disconnect the Participant with media from the Room.
 */
function disconnectFromRoom() {
  room.disconnect();
  room = null;
  connectOrDisconnect.value = 'Connect to Room';
  return;
}

/**
 * Get the Tracks of the given Participant.
 */
function getTracks(participant) {
  return Array.from(participant.tracks.values()).filter(function(publication) {
    return publication.track;
  }).map(function(publication) {
    return publication.track;
  });
}


(async function() {
  // Load the code snippet.
  const snippet = await getSnippet('./helpers.js');
  const pre = document.querySelector('pre.language-javascript');

  pre.innerHTML = Prism.highlight(snippet, Prism.languages.javascript);

  // Get the credentials to connect to the Room.
  const creds = await getRoomCredentials();

  // Connect to a random Room with no media. This Participant will
  // display the media of the second Participant that will enter
  // the Room with bandwidth constraints.
  const someRoom = await createRoomAndUpdateOnSpeakerchange(creds.token);

  // set listener to connect new user users to the room.
  connectNewUserBtn.onclick = connectNewUser;

  // Disconnect from the Room on page unload.
  window.onbeforeunload = function() {
    if (room) {
      room.disconnect();
      room = null;
    }
    someRoom.disconnect();
  };

  // Set the name of the Room to which the Participant that shares
  // media should join.
  roomName = someRoom.name;

  someRoom.on('participantConnected', function(participant) {
    const div = document.createElement('div');
    div.id = participant.sid;

    const title = document.createElement('h6');
    title.appendChild(document.createTextNode(participant.identity));
    div.appendChild(title);

    mediaContainer.appendChild(div);
    participant.on('trackSubscribed', function(track) {
      div.appendChild(track.attach());
    });
  });
  someRoom.on('participantDisconnected', function(participant) {
    getTracks(participant).forEach(function(track) {
      track.detach().forEach(function(element) {
        element.remove();
      });
    });
    const participantDiv = document.getElementById(participant.sid);
    participantDiv.parentNode.removeChild(participantDiv);
  });
}());
