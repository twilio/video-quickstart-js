/* eslint-disable new-cap */
/* eslint-disable no-console */
'use strict';

const Video = require('twilio-video');
const getRoomCredentials = require('../../util/getroomcredentials');
const joinRoomBlock = document.querySelector('#joinRoom');
const roomNameText = document.querySelector('#roomName');
const mediaContainer = document.getElementById('remote-media');
const userControls = document.getElementById('user-controls');
let roomName = null;

/**
 * creates a button and adds to given container.
 */
function createButton(text, container, btnclasses = 'btn-sm') {
  const btn = document.createElement('button');
  btn.innerHTML = text;
  btn.classList.add('btn', 'btn-outline-primary');
  btn.classList.add(btnclasses);
  container.appendChild(btn);
  return btn;
}

function generateAudioTrack(frequency = 1) {
  console.log('generating audio track');
  const audioContext = typeof AudioContext !== 'undefined'
    ? new AudioContext()
    // eslint-disable-next-line no-undef
    : new webkitAudioContext();

  const oscillatorNode = audioContext.createOscillator();
  oscillatorNode.type = 'square';
  oscillatorNode.frequency.setValueAtTime(frequency, audioContext.currentTime); // value in hertz
  const mediaStreamDestinationNode = audioContext.createMediaStreamDestination();
  oscillatorNode.connect(mediaStreamDestinationNode);
  oscillatorNode.start();
  const track = mediaStreamDestinationNode.stream.getAudioTracks()[0];
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
  const muteBtn = createButton('Mute', currentUserControls);
  connectDisconnect.onclick = async function() {
    connectDisconnect.disabled = true;
    const connected = room !== null;
    if (connected) {
      room.disconnect();
      room = null;
      muteBtn.innerHTML = 'Mute';
    } else {
      // eslint-disable-next-line require-atomic-updates
      room = await connectToRoom(creds);
    }
    connectDisconnect.innerHTML = connected ? 'Connect' : 'Disconnect';
    muteBtn.style.display = connected ? 'none' : 'inline';
    connectDisconnect.disabled = false;
  };

  muteBtn.onclick = function() {
    const mute = muteBtn.innerHTML === 'Mute';
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
  };
  muteBtn.style.display = 'none';
  userControls.appendChild(currentUserControls);
}

/**
 * Connect the Participant with media to the Room.
 */
async function connectToRoom(creds) {
  const videoTrack = await Video.createLocalVideoTrack();
  const room = await Video.connect(creds.token, {
    name: roomName,
    tracks: [generateAudioTrack(), videoTrack]
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


function renderTrack(track, mediaDiv) {
  // force track to go into enabled = false state.
  // NOTE: verified that it works - that is strack still gets started event.
  // track.attach();
  // track.detach();

  track.on('started', () => console.log('track started!', track.sid));

  const trackDiv = document.createElement('div');
  trackDiv.classList.add('trackDiv');
  const trackTitle = document.createElement('h2');
  trackTitle.appendChild(document.createTextNode(`track: ${track.sid} kind: ${track.kind}`));
  trackDiv.appendChild(trackTitle);
  mediaDiv.appendChild(trackDiv);

  // let track be detached initially.
  trackDiv.classList.add('detached');
  const attachOrDetachBtn = createButton('.attach', trackDiv, 'btn-lg');
  attachOrDetachBtn.classList.add('detach');
  attachOrDetachBtn.onclick = function() {
    const detach = attachOrDetachBtn.innerHTML === '.detach';
    if (detach) {
      const mediaElements = track.detach();
      mediaElements.forEach(mediaElement => mediaElement.remove());
      trackDiv.classList.remove('attached');
      trackDiv.classList.add('detached');
    } else {
      const mediaElements = track.attach();
      trackDiv.appendChild(mediaElements);
      trackDiv.classList.add('attached');
      trackDiv.classList.remove('detached');
    }

    attachOrDetachBtn.innerHTML = detach ? '.attach' : '.detach';
  };
}

function renderParticipant(participant) {
  const participantdiv = document.createElement('div');
  participantdiv.id = participant.sid;
  const mediaDiv = document.createElement('div');
  mediaDiv.classList.add('mediadiv');

  const title = document.createElement('h6');
  title.appendChild(document.createTextNode(participant.identity));
  mediaDiv.appendChild(title);

  participant.on('trackSubscribed', track => renderTrack(track, mediaDiv));
  participantdiv.appendChild(mediaDiv);
  mediaContainer.appendChild(participantdiv);
}

(async function() {

  // Get the credentials to connect to the Room.
  const creds = await getRoomCredentials();

  // Connect to a random Room with no media. This Participant will
  // display the media of the other Participants that will enter
  // the Room
  const someRoom = await Video.connect(creds.token, { dominantSpeaker: true, tracks: [] });

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
  };
}());
