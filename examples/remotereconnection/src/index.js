'use strict';

const Prism = require('prismjs');
const Video = require('twilio-video');
const getSnippet = require('../../util/getsnippet');
const getRoomCredentials = require('../../util/getroomcredentials');
const helpers = require('./helpers');
const remoteReconnectionUpdates = helpers.remoteReconnectionUpdates;
const handleLocalParticipantReconnectionUpdates = helpers.handleLocalParticipantReconnectionUpdates;
const handleRemoteParticipantReconnectionUpdates = helpers.handleRemoteParticipantReconnectionUpdates;

const p1Media = document.getElementById('p1-media');
const P1simulateReconnection = document.getElementById('p1-simulate-reconnection');
const P2simulateReconnection = document.getElementById('p2-simulate-reconnection');

// Update UI to indicate remote side room state changes
const onRoomStateChange = (participant, newState) => {
  const oldRoomState = document.querySelector(`#${participant} div.current`)
  if (oldRoomState) {
    oldRoomState.classList.remove('current');
  }

  const newRoomState = document.querySelector(`#${participant} div.${newState}`)
  newRoomState.classList.add('current');
}

//Get the Tracks of the given Participant.
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
  const credsP1 = await getRoomCredentials();
  const credsP2 = await getRoomCredentials();
  
  // Create room instance and name for participants to join.
  const roomP1 = await Video.connect(credsP1.token, {
    region: 'au1'
  });
  
  // Set room name for participant 2 to join.
  const roomName = roomP1.name;
  
  // Connecting remote participants.
  const roomP2 = await Video.connect(credsP2.token, {
    name: roomName,
    region: 'au1'
  });
  
  // Appends video/audio tracks when each participant is subscribed.
  roomP1.on('participantConnected', () => {
    const localUser = roomP1.localParticipant;
    getTracks(localUser).forEach(track => {
      p1Media.appendChild(track.attach());
    })
  });
  
  // if(track.isEnabled) p1Media.appendChild(track.attach());
  // Simulate reconnection button functionalities, adding in region in order to extend reconnection time
  P1simulateReconnection.onclick = () => {
    roomP1._signaling._transport._twilioConnection._close({ code: 4999, reason: 'simulate-reconnect'});
  }

  P2simulateReconnection.onclick = () => {
    roomP2._signaling._transport._twilioConnection._close({ code: 4999, reason: 'simulate-reconnect'});
  }

  // Remote room listening on remote participant's (P1) reconnection state
  roomP2.on('participantReconnecting', remoteParticipant => {
    handleRemoteParticipantReconnectionUpdates(roomP2, () => {
      onRoomStateChange('p2', remoteParticipant.state);
    });
  });

  roomP2.on('participantReconnected', remoteParticipant => {
    handleRemoteParticipantReconnectionUpdates(roomP2, () => {
      onRoomStateChange('p2', remoteParticipant.state);
    });
  });

  // Local room listening on it's own reconnection state
  roomP1.on('reconnecting', () => {
    onRoomStateChange('p1', roomP1.state);
  });

  roomP1.on('reconnected', () => {
    onRoomStateChange('p1', roomP1.state);
  });

  // Disconnect from the Room 
  window.onbeforeunload = () => {
    roomP1.disconnect();
    roomP2.disconnect();
    roomName = null;
  }
}());
