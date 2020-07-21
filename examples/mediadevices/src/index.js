'use strict';

var Video = require('twilio-video');
var Prism = require('prismjs');
var getSnippet = require('../../util/getsnippet');
var helpers = require('./helpers');
var waveform = require('../../util/waveform');
var applyInputDeviceSelection = helpers.applyInputDeviceSelection;
var applyAudioOutputDeviceSelection = helpers.applyAudioOutputDeviceSelection;
const connectOrDisconnect = document.querySelector('input#connectordisconnect');
const getRoomCredentials = require('../../util/getroomcredentials');
const mediaContainer = document.getElementById('remote-media');
const joinRoomBlock = document.querySelector('#joinRoom');
const roomNameText = document.querySelector('#roomName');
let someRoom = null;
let localAudioTrack = null;
let localVideoTrack = null;

var getDeviceSelectionOptions = helpers.getDeviceSelectionOptions;

var deviceSelections = {
  audioinput: document.querySelector('select#audioinput'),
  audiooutput: document.querySelector('select#audiooutput'),
  videoinput: document.querySelector('select#videoinput')
};

/**
 * Build the list of available media devices.
 */
function updateDeviceSelectionOptions() {
  return getDeviceSelectionOptions()
    .then(function(deviceSelectionOptions) {
      ['audioinput', 'audiooutput', 'videoinput'].forEach(function(kind) {
          var kindDeviceInfos = deviceSelectionOptions[kind];
          var select = deviceSelections[kind];

          [].slice.call(select.children).forEach(function(option) {
            option.remove();
          });

          kindDeviceInfos.forEach(function(kindDeviceInfo) {
            var deviceId = kindDeviceInfo.deviceId;
            var label = kindDeviceInfo.label || 'Device [ id: '
              + deviceId.substr(0, 5) + '... ]';

            var option = document.createElement('option');
            option.value = deviceId;
            option.appendChild(document.createTextNode(label));
            select.appendChild(option);
          });
        });
  });
}

function updateRoomBlock(room) {
  while (roomNameText.firstChild) {
    roomNameText.removeChild(roomNameText.firstChild);
  }

  joinRoomBlock.style.display = room ? 'block' : 'none';
  connectOrDisconnect.value = room ? 'Disconnect' : 'Connect';

  if (room) {
    roomNameText.appendChild(document.createTextNode(room.name));
  }
}

// Attach the Track to the DOM.
function attachTrack(track, container) {
  container.appendChild(track.attach());
}

// Detach given track from the DOM
function detachTrack(track) {
  track.detach().forEach(function(element) {
    element.remove();
  });
}

// A new RemoteTrack was published to the Room.
function trackPublished(publication, container) {
  console.log('Track was of kind ' + publication.kind + ' was published:' + publication.isSubscribed);
  if (publication.isSubscribed) {
    attachTrack(publication.track, container);
  }
  publication.on('subscribed', function(track) {
    console.log('Subscribed to ' + publication.kind + ' track');
    attachTrack(track, container);
  });
  publication.on('unsubscribed', detachTrack);
}

// A RemoteTrack was unpublished from the Room.
function trackUnpublished(publication) {
  console.log(publication.kind + ' track was unpublished.');
}

// A new RemoteParticipant joined the Room
function participantConnected(participant) {
  console.log("Participant '" + participant.identity + "' joined the room");
  let participantDiv = document.getElementById(participant.sid);
  if (!participantDiv) {
    participantDiv = document.createElement('div');
    participantDiv.id = participant.sid;
    mediaContainer.appendChild(participantDiv);
  }
  participant.tracks.forEach(function(publication) {
    trackPublished(publication, participantDiv);
  });
  participant.on('trackPublished', function(publication) {
    trackPublished(publication, participantDiv);
  });
  participant.on('trackUnpublished', trackUnpublished);
}

// Detach the Participant's Tracks from the DOM.
function participantDisconnected(participant) {
  console.log("Participant '" + participant.identity + "' joined the room");
  const participantDiv = document.getElementById(participant.sid);
  participantDiv.parentNode.removeChild(participantDiv);
}

// reads selected audio input, and updates preview and room to use the device.
async function applyAudioInputDeviceChange(event) {
  const waveformContainer = document.querySelector('div#audioinputwaveform');
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  localAudioTrack = await applyInputDeviceSelection(deviceSelections.audioinput.value, localAudioTrack, 'audio');
  const canvas = waveformContainer.querySelector('canvas');
  waveform.setStream(new MediaStream([localAudioTrack.mediaStreamTrack]));
  if (!canvas) {
    waveformContainer.appendChild(waveform.element);
  }
  maybeEnableConnectButton();
  return localAudioTrack;
}

// reads selected video input, and updates preview and room to use the device.
async function applyVideoInputDeviceChange(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const video = document.querySelector('video#videoinputpreview');
  localVideoTrack = await applyInputDeviceSelection(deviceSelections.videoinput.value, localVideoTrack, 'video');
  localVideoTrack.attach(video);
  maybeEnableConnectButton();
  return localVideoTrack;
}

// reads selected audio output, and updates preview to use the device.
function applyAudioOutputDeviceChange(event) {
  var audio = document.querySelector('audio#audioinputpreview');

  // Note: not supported on safari
  if (deviceSelections.audiooutput.value) {
    applyAudioOutputDeviceSelection(deviceSelections.audiooutput.value, audio);
  }

  event.preventDefault();
  event.stopPropagation();
}

function maybeEnableConnectButton() {
  connectOrDisconnect.disabled = !(localAudioTrack && localVideoTrack);
}

async function connectOrDisconnectRoom(event) {
  event.preventDefault();
  event.stopPropagation();
  if (someRoom) {
    someRoom.disconnect();
    someRoom = null;
  } else {
    const creds = await getRoomCredentials();
    someRoom = await Video.connect(creds.token, {
      tracks: [localVideoTrack, localAudioTrack]
    });

    // sync the preview with connected tracks.
    applyVideoInputDeviceChange();
    applyAudioInputDeviceChange();

    someRoom.participants.forEach(participantConnected);

    // listen as participants connect/disconnect
    someRoom.on('participantConnected', participantConnected);
    someRoom.on('participantDisconnected', participantDisconnected);
  }
  updateRoomBlock(someRoom);
  connectOrDisconnect.disabled = false;
}

// Load the code snippet.
getSnippet('./helpers.js').then(function(snippet) {
  var pre = document.querySelector('pre.language-javascript');
  pre.innerHTML = Prism.highlight(snippet, Prism.languages.javascript);
});

// setup device selections
updateDeviceSelectionOptions();

// Check if there are Tracks
maybeEnableConnectButton();

// Whenever a media device is added or removed, update the list.
navigator.mediaDevices.ondevicechange = updateDeviceSelectionOptions;

// Apply the selected audio input media device.
document.querySelector('button#audioinputapply').onclick = applyAudioInputDeviceChange;

// Apply the selected video input media device.
document.querySelector('button#videoinputapply').onclick = applyVideoInputDeviceChange;

// Apply the selected audio output media device.
// NOTE: safari does not let us query the output device (and its HTMLAudioElement does not have setSinkId)
document.querySelector('button#audiooutputapply').onclick = applyAudioOutputDeviceChange;

// Connect/Disconnect the room.
connectOrDisconnect.onclick = connectOrDisconnectRoom;

// Disconnect from the Room on page unload.
window.onbeforeunload = function() {
  if (someRoom) {
    someRoom.disconnect();
    someRoom = null;
  }
};
