'use strict';

const Prism = require('prismjs');
const Video = require('twilio-video');
const getRoomCredentials = require('../../util/getroomcredentials');
const getSnippet = require('../../util/getsnippet');
const helpers = require('./helpers');
const connectToRoomWithNetworkQuality = helpers.connectToRoomWithNetworkQuality;
const setupNetworkQualityUpdates = helpers.setupNetworkQualityUpdates;

const joinRoomBlock = document.querySelector('#joinRoom');
const roomNameText = document.querySelector('#roomName');
const mediaContainer = document.getElementById('remote-media');
const userControls = document.getElementById('user-controls');
let roomName = null;

/**
 * creates a button and add to given container.
 */
function createButton(text, container) {
  const btn = document.createElement('button');
  btn.innerHTML = text;
  btn.classList.add('btn', 'btn-outline-primary', 'btn-sm');
  container.appendChild(btn);
  return btn;
}

/**
 *
 * Creates controls for user to disconnect from the Room.
 */
async function createUserControls(userIdentity) {
  const creds = await getRoomCredentials(userIdentity);
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
    } else {
      room = await connectToRoom(creds);
    }
    connectDisconnect.innerHTML = connected ? 'Connect' : 'Disconnect';
    connectDisconnect.disabled = false;
  };
  userControls.appendChild(currentUserControls);
}

/**
 * Connect the Participant with media to the Room.
 */
function connectToRoom(creds) {
  return Video.connect(creds.token, {
    name: roomName,
    networkQuality: {
      local: 1,
      remote: 1
    }
  });
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

function showParticipant(participant, isRemote) {
  const participantdiv = document.createElement('div');
  participantdiv.id = participant.sid;
  const mediaDiv = document.createElement('div');
  mediaDiv.classList.add('mediadiv');

  const title = document.createElement('h6');
  mediaDiv.appendChild(title);
  participantdiv.appendChild(mediaDiv);
  mediaContainer.appendChild(participantdiv);
  updateNetworkQualityReport(participant);

  if (isRemote) {
    participant.on('trackSubscribed', function(track) {
      mediaDiv.appendChild(track.attach());
    });
  } else {
    getTracks(participant).forEach(function(track) {
      mediaDiv.appendChild(track.attach());
    });
  }
}


/**
 * Updates the Network Quality report for a Participant.
 */
function updateNetworkQualityReport(participant) {
  const participantDiv = document.getElementById(participant.sid);
  const title = participantDiv.querySelector('h6');
  title.innerHTML = `NQ Level (${participant.identity}): ${participant.networkQualityLevel}`
}

(async function() {
  // Load the code snippet.
  const snippet = await getSnippet('./helpers.js');
  const pre = document.querySelector('pre.language-javascript');

  pre.innerHTML = Prism.highlight(snippet, Prism.languages.javascript);

  // Get the credentials to connect to the Room.
  const creds = await getRoomCredentials('You');

  // Connect to a random Room with no media. This Participant will
  // display the media of the other Participants that will enter
  // the Room and watch for Network Quality updates.
  let someRoom = await connectToRoomWithNetworkQuality(creds.token, 1, 1);
  showParticipant(someRoom.localParticipant, false);

  // Set the name of the Room to which the Participant that shares
  // media should join.
  joinRoomBlock.style.display = 'block';
  roomName = someRoom.name;
  roomNameText.appendChild(document.createTextNode(roomName));

  // create controls to connect few users
  ['Alice', 'Bob', 'Charlie', 'Mak'].forEach(createUserControls);

  someRoom.on('participantConnected', function(participant) {
    showParticipant(participant, true);
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

  setupNetworkQualityUpdates(someRoom, updateNetworkQualityReport);

  // Disconnect from the Room on page unload.
  window.onbeforeunload = function() {
    someRoom.disconnect();
    someRoom = null;
  };
}());
