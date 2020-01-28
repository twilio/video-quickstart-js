'use strict';


const Prism = require('prismjs');
const Video = require('twilio-video');
const getSnippet = require('../../util/getsnippet');
const getRoomCredentials = require('../../util/getroomcredentials');
const helpers = require('./helpers');

var video = document.querySelector('video#videoinputpreview');
let roomName = 'exampleRoom';

// Connect participant 1, displaying audio/video
async function connectToRoom(creds) {
  const room = await Video.connect(creds.token, {
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
  roomName = roomP1.name

  // Connecting remote participants.
  const roomP2 = await Video.connect(credsP2.token, {
    name:roomName,
    tracks: [],
  });

  // Append roomP1 published tracks to the DOM.

}());