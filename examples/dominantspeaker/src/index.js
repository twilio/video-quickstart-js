'use strict';

const Prism = require('prismjs');
const Video = require('twilio-video');
const getRoomCredentials = require('../../util/getroomcredentials');
const getSnippet = require('../../util/getsnippet');
const helpers = require('./helpers');
const createRoomAndUpdateOnSpeakerchange = helpers.createRoomAndUpdateOnSpeakerchange;
const connectNewUserBtn = document.querySelector('input#connectNewUser');
const mediaContainer = document.getElementById('remote-media');
const userControls = document.getElementById('user-controls');
let roomName = null;

/**
 * creates a button and adds to given container.
 */
function createButton(text, container) {
  const btn = document.createElement('button');
  btn.innerHTML = text; // 'Disconnect';
  btn.classList.add('btn', 'btn-outline-primary', 'btn-sm');
  container.appendChild(btn);
  return btn;
}
/**
 *
 * creates controls for user to mute/unmute and disconnect
 * from the room.
 */
function createUserControls(room) {
  const localUser = room.localParticipant;
  const currentUserControls = document.createElement('div');
  currentUserControls.classList.add('usercontrol');

  const title = document.createElement('h6');
  title.appendChild(document.createTextNode(localUser.identity));
  currentUserControls.appendChild(title);

  const disconnectBtn = createButton('Disconnect', currentUserControls);
  disconnectBtn.onclick = function() {
    room.disconnect();
    currentUserControls.parentNode.removeChild(currentUserControls);
  }

  // mute button.
  const muteBtn = createButton('Mute', currentUserControls);
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
  userControls.appendChild(currentUserControls);
}

/**
 * Connect the Participant with media to the Room.
 */
async function connectToRoom() {
  const creds = await getRoomCredentials();
  const room = await Video.connect( creds.token, {
    name: roomName
  });

  createUserControls(room);
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
  // display the media of the other Participants that will enter
  // the Room and watch for dominant speaker updates.
  const someRoom = await createRoomAndUpdateOnSpeakerchange(creds.token);

  // set listener to connect new users to the room.
  connectNewUserBtn.style.display = 'block';
  connectNewUserBtn.onclick = function(event) {
    event.preventDefault();
    connectToRoom();
  };

  // Disconnect from the Room on page unload.
  window.onbeforeunload = function() {
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
