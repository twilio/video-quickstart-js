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

// <div id="audioinputwaveform"></div>
// <audio id="audioinputpreview" autoplay></audio>

/**
 * creates a button and adds to given container.
 */
function createButton(text, container) {
  const btn = document.createElement('button');
  btn.innerHTML = text;
  btn.classList.add('btn', 'btn-outline-primary', 'btn-sm');
  container.appendChild(btn);
  return btn;
}

function generateAudioTrack(frequency = 1) {
  console.log('generating audio track');
  const audioContext = typeof AudioContext !== 'undefined'
    ? new AudioContext()
    : new webkitAudioContext();

  const oscillatorNode = audioContext.createOscillator()
  oscillatorNode.type = 'square';
  oscillatorNode.frequency.setValueAtTime(frequency, audioContext.currentTime); // value in hertz
  const mediaStreamDestinationNode = audioContext.createMediaStreamDestination()
  oscillatorNode.connect(mediaStreamDestinationNode)
  oscillatorNode.start()
  const track = mediaStreamDestinationNode.stream.getAudioTracks()[0]
  return track;
}

/**
 *
 * creates controls for user to mute/unmute and disconnect
 * from the room.
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
    name: roomName,
    tracks: [generateAudioTrack()]
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
 * @param {?Participant} speaker - Participant
 * @returns {void}
 */
function updateDominantSpeaker(speaker) {
  const dominantSpeakerDiv = document.querySelector('div.dominant_speaker');
  if (dominantSpeakerDiv) {
    dominantSpeakerDiv.classList.remove('dominant_speaker');
  }
  if (speaker) {
    const newDominantSpeakerDiv = document.getElementById(speaker.sid);
    if (newDominantSpeakerDiv) {
      newDominantSpeakerDiv.classList.add('dominant_speaker');
    }
  }
}

function renderParticipant(participant) {
  const participantdiv = document.createElement('div');
  participantdiv.id = participant.sid;
  const mediaDiv = document.createElement('div');
  mediaDiv.classList.add("mediadiv");

  const title = document.createElement('h6');
  title.appendChild(document.createTextNode(participant.identity));
  mediaDiv.appendChild(title);

  participant.on('trackSubscribed', function(track) {
    const trackDiv = document.createElement('div');
    const trackTitle = document.createElement('h6');
    trackTitle.appendChild(document.createTextNode(`track: ${track.sid} kind: ${track.kind}`));
    trackDiv.appendChild(trackTitle);

    const trackEl = track.attach();
    trackDiv.appendChild(trackEl);
    mediaDiv.appendChild(trackDiv);

    const attachOrDetachBtn = createButton('.detach', trackDiv);
    attachOrDetachBtn.onclick = function() {
      const detach = attachOrDetachBtn.innerHTML == '.detach';
      if (detach) {
        const mediaElements = track.detach();
        mediaElements.forEach(mediaElement => mediaElement.remove());
      } else {
        const mediaElements = audioTrack.attach();
        trackDiv.appendChild(audioElement);
      }

      attachOrDetachBtn.innerHTML = detach ? '.attach' : '.detach';
    }
  });

  participantdiv.appendChild(mediaDiv);
  mediaContainer.appendChild(participantdiv);
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

  setupDominantSpeakerUpdates(someRoom, updateDominantSpeaker);

  // Set the name of the Room to which the Participant that shares
  // media should join.
  joinRoomBlock.style.display = 'block';
  roomName = someRoom.name;
  roomNameText.appendChild(document.createTextNode(roomName));

  // create controls to connect few users
  ['Alice', 'Bob', 'Charlie', 'Mak'].forEach(createUserControls);

  someRoom.on('participantConnected', renderParticipant);
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
