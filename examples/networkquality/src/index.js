'use strict';

const Prism = require('prismjs');
const Video = require('twilio-video');
const getRoomCredentials = require('../../util/getroomcredentials');
const getSnippet = require('../../util/getsnippet');
const helpers = require('./helpers');
const connectToRoomWithNetworkQuality = helpers.connectToRoomWithNetworkQuality;
const setupNetworkQualityUpdates = helpers.setupNetworkQualityUpdates;
const setNetworkQualityConfiguration = helpers.setNetworkQualityConfiguration;

const joinRoomBlock = document.getElementById('joinroom');
const roomNameText = document.getElementById('roomname');
const mediaContainer = document.getElementById('remotemedia');
const userControls = document.getElementById('usercontrols');
const setupRoomBtn = document.getElementById('setuproom');
const localVerbosity = document.getElementById('local');
const remoteVerbosity = document.getElementById('remote');

let roomName = null;
let rooms = new Set();
let someRoom = null;

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
 * Creates controls for additional users to connect/disconnect from the Room.
 */
async function createUserControls(userIdentity) {
  const creds = await getRoomCredentials(userIdentity);
  let room = null;

  const currentUserControls = document.createElement('div');
  currentUserControls.classList.add('usercontrol');

  const title = document.createElement('span');
  title.innerText = creds.identity;
  currentUserControls.appendChild(title);

  // connect button
  const connectDisconnect = createButton('Connect', currentUserControls);
  connectDisconnect.onclick = async function() {
    connectDisconnect.disabled = true;
    const connected = room !== null;
    if (connected) {
      room.disconnect();
      rooms.delete(room);
      room = null;
    } else {
      room = await connectToRoom(creds);
      rooms.add(room);
    }
    connectDisconnect.innerHTML = connected ? 'Connect' : 'Disconnect';
    connectDisconnect.disabled = false;
  };
  userControls.appendChild(currentUserControls);
}

/**
 * Clear the user controls.
 */
function clearUserControls() {
  userControls.querySelectorAll('.usercontrol').forEach(function(controls) {
    controls.remove();
  });
}

/**
 * Connect the Participant with media to the Room.
 */
function connectToRoom(creds) {
  return Video.connect(creds.token, {
    name: roomName
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

/**
 * Show the UI for the given Participant.
 */
function showParticipant(participant, isRemote) {
  const participantDiv = document.createElement('div');
  participantDiv.id = participant.sid;
  const mediaDiv = document.createElement('div');
  mediaDiv.classList.add('mediadiv');

  const title = document.createElement('h6');
  mediaDiv.appendChild(title);
  participantDiv.appendChild(mediaDiv);

  const stats = document.createElement('textarea');
  stats.setAttribute('readonly', 'true');
  participantDiv.appendChild(stats);

  mediaContainer.appendChild(participantDiv);
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
 * Remove a Participant's UI.
 */
function removeParticipant(participant) {
  const participantDiv = document.getElementById(participant.sid);
  participantDiv.parentNode.removeChild(participantDiv);
}

/**
 * Updates the Network Quality report for a Participant.
 */
function updateNetworkQualityReport(participant) {
  const participantDiv = document.getElementById(participant.sid);
  const title = participantDiv.querySelector('h6');
  title.innerHTML = `NQ Level (${participant.identity}): ${participant.networkQualityLevel}`;
  const stats = participantDiv.querySelector('textarea');
  stats.value = `NQ Stats:\r\n========\r\n${JSON.stringify(participant.networkQualityStats, null, 2)}`;
}

/**
 * Set up the Room.
 */
async function setupRoom(e) {
  e.preventDefault();

  // Get the credentials to connect to the Room.
  const creds = await getRoomCredentials('You');

  // Connect to a random Room with no media. This Participant will
  // display the media of the other Participants that will enter
  // the Room and watch for Network Quality updates.
  someRoom = await connectToRoomWithNetworkQuality(
    creds.token,
    parseInt(localVerbosity.value, 10),
    parseInt(remoteVerbosity.value, 10));

  showParticipant(someRoom.localParticipant, false);

  // Set the name of the Room to which the Participant that shares
  // media should join.
  joinRoomBlock.style.display = 'block';
  roomName = someRoom.name;
  roomNameText.innerText = roomName;

  // Listen for changes in verbosity levels and update the Room's Network Quality
  // Configuration.
  localVerbosity.onchange = remoteVerbosity.onchange = function() {
    setNetworkQualityConfiguration(
      someRoom,
      parseInt(localVerbosity.value, 10),
      parseInt(remoteVerbosity.value, 10));
  };

  // Convert the "Create Room" button to a "Leave Room" button.
  setupRoomBtn.onclick = teardownRoom;
  setupRoomBtn.value = 'Leave Room';

  // create controls to connect few users
  ['Alice', 'Bob', 'Charlie', 'Mak'].forEach(createUserControls);

  someRoom.on('participantConnected', function(participant) {
    showParticipant(participant, true);
  });

  someRoom.on('participantDisconnected', removeParticipant);
  setupNetworkQualityUpdates(someRoom, updateNetworkQualityReport);

  // Disconnect from the Room on page unload.
  window.onbeforeunload = teardownRoom;
}

/**
 * Tear down the Room.
 */
function teardownRoom(e) {
  e.preventDefault();
  if (someRoom) {
    someRoom.participants.forEach(removeParticipant);
    removeParticipant(someRoom.localParticipant);
    clearUserControls();
    someRoom.disconnect();
    someRoom = null;
    joinRoomBlock.style.display = 'none';
    roomName = '';
    roomNameText.innerText = '';
    setupRoomBtn.onclick = setupRoom;
    setupRoomBtn.value = 'Create Room';
    localVerbosity.onchange = remoteVerbosity.onchange = null;
  }
  rooms.forEach(function(room) {
    room.disconnect();
    rooms.delete(room);
  });
}

(async function() {
  // Load the code snippet.
  const snippet = await getSnippet('./helpers.js');
  const pre = document.querySelector('pre.language-javascript');
  pre.innerHTML = Prism.highlight(snippet, Prism.languages.javascript);
  setupRoomBtn.onclick = setupRoom;
}());
