/* eslint-disable no-console */
/* eslint-disable quotes */
'use strict';

var urlParams = new URLSearchParams(window.location.search);
document.getElementById('room-name').value = urlParams.get('room');
const Waveform = require('../../examples/util/waveform');
const getRoomCredentials = require('../../examples/util/getroomcredentials');
var Video = require('twilio-video');

const videoCheck = document.getElementById('videoCheck');
const audioCheck = document.getElementById('audioCheck');
videoCheck.checked = !urlParams.has('novideo');
audioCheck.checked = !urlParams.has('noaudio');
console.log("videoCheck.checked:", videoCheck.checked, "audioCheck.checked:", audioCheck.checked);

const remoteMediaContainer = document.getElementById('remote-media');

const btnUnpublishAudio = document.getElementById('button-unpublish-audio');
const btnPublishAudio = document.getElementById('button-publish-audio');

const btnUnpublishVideo = document.getElementById('button-unpublish-video');
const btnPublishVideo = document.getElementById('button-publish-video');
const btnJoin = document.getElementById('button-join');
const btnLeave =  document.getElementById('button-leave');

const localAudioTrackContainer = document.getElementById('audioTrack');
const localVideoTrackContainer = document.getElementById('videoTrack');
const btnPreviewAudio = document.getElementById('button-preview-audio');
const btnPreviewVideo = document.getElementById('button-preview-video');

var activeRoom;
var identity;

let localAudioTrack = null;
let localVideoTrack = null;

/**
 * Attach the AudioTrack to the HTMLAudioElement and start the Waveform.
 */
function attachAudioTrack(track, container) {
  var audioElement = container.appendChild(track.attach());
  const waveform = new Waveform();
  waveform.setStream(audioElement.srcObject);
  const canvasContainer = document.createElement('div');
  canvasContainer.classList.add('canvasContainer');
  canvasContainer.appendChild(waveform.element);
  container.appendChild(canvasContainer);
}

function getChildDiv(container, divClass) {
  var el = container.querySelector('.' + divClass);
  if (!el) {
    el = document.createElement('div');
    el.classList.add(divClass);
    container.appendChild(el);
  }

  return el;
}

function createElement(container, { type, id, className }) {
  const el = document.createElement(type);
  el.id = id;
  el.className = className;
  container.appendChild(el);
  return el;
}

function createButton(text, container) {
  const btn = document.createElement('button');
  btn.innerHTML = text;
  btn.classList.add('btn', 'btn-outline-primary', 'btn-sm');
  container.appendChild(btn);
  return btn;
}


function createLabeledStat(container, label, { id, className }) {
  const el = createElement(container, { type: 'p', id, className });
  return {
    setText: text => {
      el.textContent = label + ': ' + text;
    }
  };
}

function createTrackStats(track, container) {
  var statsContainer = getChildDiv(container, 'trackStats');
  const id = track.sid || track.id;
  statsContainer.id = 'stats_' + track.id;

  const readyState = createLabeledStat(statsContainer, 'readyState', { id: 'readyState_' + id, className: 'readyState' });
  const enabled = createLabeledStat(statsContainer, 'enabled', { id: 'enabled_' + id, className: 'enabled' });
  const muted = createLabeledStat(statsContainer, 'muted', { id: 'muted_' + id, className: 'muted' });
  const started = createLabeledStat(statsContainer, 'started', { id: 'started_' + id, className: 'started' });
  const ended = createLabeledStat(statsContainer, 'ended', { id: 'ended_' + id, className: 'ended' });
  const bytes = createLabeledStat(statsContainer, 'bytes', { id: 'bytes_' + id, className: 'bytes' });
  bytes.setText('0');

  function updateTrackState(event, byteUpdate) {
    if (event === 'bytes') {
      bytes.setText(byteUpdate);
    } else {
      log(`${track.sid || track.id} got: ${event}`);
      readyState.setText(track.mediaStreamTrack.readyState);
      enabled.setText((track.isEnabled === track.mediaStreamTrack.enabled) ?  track.isEnabled : `${track.isEnabled} != ${track.mediaStreamTrack.enabled}`);
      started.setText(track.isStarted);
      muted.setText(track.mediaStreamTrack.muted);
      if (event === 'ended') {
        ended.setText('true');
      } else if (event === 'initial') {
        ended.setText('unknown');
      }
    }
  }

  updateTrackState('initial');

  track.on('disabled', () => updateTrackState('disabled'));
  track.on('enabled', () => updateTrackState('enabled'));
  track.on('stopped', () => updateTrackState('stopped'));
  track.on('started', () => updateTrackState('started'));
  track.mediaStreamTrack.addEventListener('ended', () => updateTrackState('ended'));
  track.mediaStreamTrack.addEventListener('mute', () => updateTrackState('mute'));
  track.mediaStreamTrack.addEventListener('unmute', () => updateTrackState('unmute'));

  return updateTrackState.bind(null, 'bytes');
}

const trackStatUpdater = new Map();
function updateTrackStats({ trackId, trackSid, bytesSent, bytesReceived, trackType }) {
  const isRemote = trackType === 'remoteVideoTrackStats' || trackType ===  'remoteAudioTrackStats';
  trackStatUpdater.forEach((updater, track) => {
    if (track.sid === trackSid || track.id === trackId) {
      updater(isRemote ? bytesReceived : bytesSent);
    }
  });
}

// Attach the Track to the DOM.
function attachTrack(track, container, isLocal) {
  const audioContainer = getChildDiv(container, 'audioContainer');
  const videoContainer = getChildDiv(container, 'videoContainer');
  const trackContainer = track.kind === 'audio' ? audioContainer : videoContainer;
  trackStatUpdater.set(track, createTrackStats(track, trackContainer));

  if (isLocal) {
    createButton('disable', trackContainer).onclick = () => track.disable();
    createButton('enable', trackContainer).onclick = () => track.enable();
    createButton('stop', trackContainer).onclick = () => track.stop();
  }

  if (track.kind === 'audio') {
    attachAudioTrack(track, trackContainer);
    return;
  }
  trackContainer.appendChild(track.attach());
}

// Detach given track from the DOM.
function detachTrack(track, container) {
  const trackContainer = getChildDiv(container, track.kind === 'audio' ? 'audioContainer' : 'videoContainer');
  track.detach().forEach(function(element) {
    element.remove();
  });
  trackStatUpdater.delete(track);
  container.removeChild(trackContainer);
}

// Attach array of Tracks to the DOM.
function attachTracks(tracks, container, isLocal) {
  tracks.forEach(track => attachTrack(track, container, isLocal));
}

// Appends remoteParticipant name to the DOM.
function appendName(identity, container) {
  const name = document.createElement('p');
  name.id = `participantName-${identity}`;
  name.className = 'instructions';
  name.textContent = identity;
  container.appendChild(name);
}


// A new RemoteTrack was published to the Room.
function trackPublished(publication, container) {
  if (publication.isSubscribed) {
    attachTrack(publication.track, container);
  }
  publication.on('subscribed', function(track) {
    log('Subscribed to ' + publication.kind + ' track');
    attachTrack(track, container);
  });
  publication.on('unsubscribed', track => detachTrack(track, container));
}

// A RemoteTrack was unpublished from the Room.
function trackUnpublished(publication) {
  log(publication.kind + ' track was unpublished.');
}

// A new RemoteParticipant joined the Room
function participantConnected(participant, container, isLocal = false) {
  let selfContainer = document.createElement('div');
  selfContainer.id = `participantContainer-${participant.identity}`;
  getChildDiv(selfContainer, 'audioContainer');
  getChildDiv(selfContainer, 'videoContainer');

  container.appendChild(selfContainer);
  appendName(participant.identity, selfContainer);

  if (isLocal) {
    attachTracks(getTracks(participant), selfContainer, isLocal);
  } else {
    participant.tracks.forEach(publication => trackPublished(publication, selfContainer));
    participant.on('trackPublished', publication => trackPublished(publication, selfContainer));
    participant.on('trackUnpublished', trackUnpublished);
  }
}

function participantDisconnected(participant) {
  const container = document.getElementById(`participantContainer-${participant.identity}`);
  var tracks = getTracks(participant);
  tracks.forEach(track => detachTrack(track, container));
  if (container && container.parentNode) {
    container.parentNode.removeChild(container);
  }
}


// When we are about to transition away from this page, disconnect
// from the room, if joined.
window.addEventListener('beforeunload', leaveRoomIfJoined);

function joinRoom(token) {
  var roomName = document.getElementById('room-name').value;
  if (!roomName) {
    // eslint-disable-next-line no-alert
    alert('Please enter a room name.');
    return;
  }

  log("Joining room '" + roomName + "'...");
  var connectOptions = {
    audio: audioCheck.checked,
    video: videoCheck.checked,
    name: roomName,
    logLevel: 'debug'
  };

  if (localAudioTrack || localVideoTrack) {
    connectOptions.tracks = [];
    if (localAudioTrack) {
      connectOptions.tracks.push(localAudioTrack);
    }
    if (localVideoTrack) {
      connectOptions.tracks.push(localVideoTrack);
    }
  }

  // Join the Room with the token from the server and the
  // LocalParticipant's Tracks.
  Video.connect(token, connectOptions).then(roomJoined, function(error) {
    log('Could not connect to Twilio: ' + error.message);
  });
}

function updateControls(connected) {
  document.getElementById('room-controls').style.display = 'block';

  [btnLeave, btnUnpublishAudio, btnPublishAudio, btnUnpublishVideo, btnPublishVideo].forEach(btn => {
    btn.disabled = connected === false;
  });

  [btnJoin, btnPreviewAudio, btnPreviewVideo].forEach(btn => {
    btn.disabled = connected === true;
  });
}

(async function main() {
  updateControls(false);
  const creds = await getRoomCredentials();

  btnJoin.onclick = () => joinRoom(creds.token);
  btnLeave.onclick = function() {
    log('Leaving room...');
    activeRoom.disconnect();
  };
}());


// Get the Participant's Tracks.
function getTracks(participant) {
  return Array.from(participant.tracks.values()).filter(function(publication) {
    return publication.track;
  }).map(function(publication) {
    return publication.track;
  });
}

// Successfully connected!
function roomJoined(room) {
  updateControls(true);
  window.room = activeRoom = room;

  log("Joined as '" + identity + "'");

  // Attach the Tracks of the Room's Participants.
  // participantConnected(room.localParticipant, localMediaContainer, true);

  room.participants.forEach(function(participant) {
    log("Already in Room: '" + participant.identity + "'");
    participantConnected(participant, remoteMediaContainer);
  });

  // When a Participant joins the Room, log the event.
  room.on('participantConnected', function(participant) {
    log("Joining: '" + participant.identity + "'");
    participantConnected(participant, remoteMediaContainer);
  });

  // When a Participant leaves the Room, detach its Tracks.
  room.on('participantDisconnected', function(participant) {
    log("RemoteParticipant '" + participant.identity + "' left the room");
    participantDisconnected(participant);

  });

  var statUpdater = setInterval(async () => {
    const statReports = await room.getStats();
    statReports.forEach(statReport => {
      ['remoteVideoTrackStats', 'remoteAudioTrackStats', 'localAudioTrackStats', 'localVideoTrackStats'].forEach(trackType => {
        statReport[trackType].forEach(trackStats => updateTrackStats({ ...trackStats, trackType }));
      });
    });
  }, 100);

  // Once the LocalParticipant leaves the room, detach the Tracks
  // of all Participants, including that of the LocalParticipant.
  room.on('disconnected', function() {
    log('Left');
    clearInterval(statUpdater);
    room.participants.forEach(participantDisconnected);
    activeRoom = null;
    updateControls(false);
  });
}

btnPreviewAudio.onclick = async () => {
  if (localAudioTrack) {
    detachTrack(localAudioTrack, localAudioTrackContainer);
    localAudioTrack = null;
  }

  // eslint-disable-next-line require-atomic-updates
  localAudioTrack = await Video.createLocalAudioTrack();
  attachTrack(localAudioTrack, localAudioTrackContainer, true);
};

btnPublishAudio.onclick = () => {
  if (localAudioTrack) {
    activeRoom.localParticipant.publishTrack(localAudioTrack);
  }
};

btnUnpublishAudio.onclick = () => {
  if (localAudioTrack) {
    activeRoom.localParticipant.unpublishTrack(localAudioTrack);
  }
};

btnUnpublishVideo.onclick = () => {
  if (localVideoTrack) {
    activeRoom.localParticipant.unpublishTrack(localVideoTrack);
  }
};

btnPublishVideo.onclick = () => {
  if (localVideoTrack) {
    activeRoom.localParticipant.publishTrack(localVideoTrack);
  }
};

btnPreviewVideo.onclick = async () => {
  if (localVideoTrack) {
    detachTrack(localVideoTrack, localVideoTrackContainer);
    localVideoTrack = null;
  }
  // eslint-disable-next-line require-atomic-updates
  localVideoTrack = await Video.createLocalVideoTrack();
  attachTrack(localVideoTrack, localVideoTrackContainer, true);
};

// Activity log.
function log(message) {
  var logDiv = document.getElementById('log');
  logDiv.innerHTML += '<p>&gt;&nbsp;' + message + '</p>';
  logDiv.scrollTop = logDiv.scrollHeight;
}

// Leave Room.
function leaveRoomIfJoined() {
  if (activeRoom) {
    activeRoom.disconnect();
  }
}
