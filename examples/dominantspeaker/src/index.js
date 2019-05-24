'use strict';

const Prism = require('prismjs');
const Video = require('twilio-video');
const getRoomCredentials = require('../../util/getroomcredentials');
const getSnippet = require('../../util/getsnippet');
const helpers = require('./helpers');
const connectToRoomWithDominantSpeaker = helpers.connectToRoomWithDominantSpeaker;
const setupDominantSpeakerUpdates = helpers.setupDominantSpeakerUpdates;

const joinRoomBlock = document.querySelector('#joinRoom');
const roomNameText = document.querySelector('#roomName');
const mediaContainer = document.getElementById('remote-media');
const userControls = document.getElementById('user-controls');
let roomName = null;
const SAMPLE_USER_COUNT = 4;

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
async function createUserControls() {
  const creds = await getRoomCredentials();
  let room = null;

  const currentUserControls = document.createElement('div');
  currentUserControls.classList.add('usercontrol');

  const title = document.createElement('h6');
  title.appendChild(document.createTextNode(creds.identity));
  currentUserControls.appendChild(title);

  // connect button
  const connectDisconnect = createButton('Connect', currentUserControls);
  connectDisconnect.onclick = async function(event) {
    connectDisconnect.disabled = true;
    const connected = room !== null;
    if (connected) {
      room.disconnect();
      room = null;
      muteBtn.innerHTML = 'Mute';
    } else {
      room = await connectToRoom(creds);
    }
    connectDisconnect.innerHTML = connected ? 'Connect' : 'Disconnect';
    muteBtn.style.display = connected ? 'none' : 'inline';
    connectDisconnect.disabled = false;
  }

  // mute button.
  const muteBtn = createButton('Mute', currentUserControls);
  muteBtn.onclick = function() {
    const mute = muteBtn.innerHTML == 'Mute';
    const localUser = room.localParticipant;
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
  muteBtn.style.display = 'none';
  userControls.appendChild(currentUserControls);
}

/**
 * Connect the Participant with media to the Room.
 */
async function connectToRoom(creds) {
  const room = await Video.connect( creds.token, {
    name: roomName
  });

  return room;
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

/**
 * add/removes css attribute per dominant speaker change.
 * @param {Participant} speaker - Participant
 * @param {boolean} add - boolean true when new speaker is detected. false for old speaker
 * @returns {void}
 */
function updateDominantSpeaker(speaker, add) {
  if (speaker) {
    const participantDiv = document.getElementById(speaker.sid);
    if (participantDiv) {
      participantDiv.classList[add ? 'add' : 'remove']('dominent_speaker');
    }
  }
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
  const someRoom = await connectToRoomWithDominantSpeaker(creds.token);

  let dominantSpeaker = null;
  setupDominantSpeakerUpdates(someRoom, function(participant) {
    updateDominantSpeaker(dominantSpeaker, false);
    dominantSpeaker = participant;
    updateDominantSpeaker(dominantSpeaker, true);
  });

  // Set the name of the Room to which the Participant that shares
  // media should join.
  joinRoomBlock.style.display = 'block';
  roomName = someRoom.name;
  roomNameText.appendChild(document.createTextNode(roomName));

  // create few user controls.
  for (let i = 0; i < SAMPLE_USER_COUNT; i++) {
    createUserControls();
  }

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

  // Disconnect from the Room on page unload.
  window.onbeforeunload = function() {
    someRoom.disconnect();
    someRoom = null;
  };
}());
