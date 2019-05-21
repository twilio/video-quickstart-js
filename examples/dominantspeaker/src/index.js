'use strict';

const Prism = require('prismjs');
const Video = require('twilio-video');
const getRoomCredentials = require('../../util/getroomcredentials');
const getSnippet = require('../../util/getsnippet');
const helpers = require('./helpers');
const createRoomAndUpdateOnSpeakerchange = helpers.createRoomAndUpdateOnSpeakerchange;
const updateBandwidthConstraints = helpers.updateBandwidthConstraints;

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
  currentUserControls.innerText = localUser.identity;
  const disconnectBtn = document.createElement("input");
  disconnectBtn.value = 'Disconnect';
  disconnectBtn.classList.add("btn", "btn-primary", "btn-sm");
  const muteBtn = document.createElement("input");
  muteBtn.classList.add("btn", "btn-primary", "btn-sm");
  currentUserControls.appendChild(disconnectBtn);
  currentUserControls.appendChild(muteBtn);

  disconnectBtn.onclick = function () {
    console.log()
    room.disconnect(" Disconnecting: localUser");
    currentUserControls.parentNode.removeChild(currentUserControls);
  }

  muteBtn.value = "Mute";
  muteBtn.onclick = function () {
    const mute = muteBtn.value == "Mute";
    console.log("mute = ", mute);
    getTracks(localUser).forEach(function(track) {
      console.log('track.kind :', track.kind);
      if (track.kind === 'audio') {
        if (mute) {
          track.disable();
        } else {
          track.enable();
        }
      }
    });
    muteBtn.value = mute ? "UnMute" : "Mute";
  }
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

function onDominantSpeakerChanged(participant) {
  console.log('The new dominant speaker in the Room is:', participant);
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


  // Set listener to the connect or disconnect button.
  connectNewUserBtn.onclick = connectNewUser;


  // Get the credentials to connect to the Room.
  const creds = await getRoomCredentials();

  // Connect to a random Room with no media. This Participant will
  // display the media of the second Participant that will enter
  // the Room with bandwidth constraints.
  let dominantSpeaker = null;
  const someRoom = await createRoomAndUpdateOnSpeakerchange(creds.token, function (participant) {
    if (dominantSpeaker) {
      const participantDiv = document.getElementById(dominantSpeaker.sid);
      if (participantDiv) {
        participantDiv.classList.remove("dominent_speaker");
      }
    }
    dominantSpeaker = participant;
    if (dominantSpeaker) {
      const participantDiv = document.getElementById(dominantSpeaker.sid);
      if (participantDiv) {
        participantDiv.classList.add("dominent_speaker");
      }
    }
  });

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
    div.innerText = participant.identity;
    mediaContainer.appendChild(div);
    participant.on('trackSubscribed', function (track) {
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
    console.log("removing node ", participantDiv);
    participantDiv.parentNode.removeChild(participantDiv);
  });
}());
