'use strict';

var Prism = require('prismjs');
var getSnippet = require('../../util/getsnippet');
var helpers = require('./helpers');
var waveform = require('../../util/waveform');
var applyAudioInputDeviceSelection = helpers.applyAudioInputDeviceSelection;
var applyAudioOutputDeviceSelection = helpers.applyAudioOutputDeviceSelection;
var applyVideoInputDeviceSelection = helpers.applyVideoInputDeviceSelection;
const connectOrDisconnect = document.querySelector('input#connectordisconnect');
const getRoomCredentials = require('../../util/getroomcredentials');
const mediaContainer = document.getElementById('remote-media');
const joinRoomBlock = document.querySelector('#joinRoom');
const roomNameText = document.querySelector('#roomName');
const Video = require('twilio-video');

let roomName = null;
let someRoom = null;

var getDeviceSelectionOptions = helpers.getDeviceSelectionOptions;

var deviceSelections = {
  audioinput: document.querySelector('select#audioinput'),
  audiooutput: document.querySelector('select#audiooutput'),
  videoinput: document.querySelector('select#videoinput')
};

function getMediaPermissions() {
  return navigator.mediaDevices.getUserMedia({ audio: true, video: true }).catch(function(error) {
    console.error('failed to obtain media permissions', error);
    throw error;
  });
}

/**
 * Build the list of available media devices.
 */
function updateDeviceSelectionOptions() {
  getDeviceSelectionOptions().then(function(deviceSelectionOptions) {
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

function setRoom(room) {
  while (roomNameText.firstChild) {
    roomNameText.removeChild(roomNameText.firstChild);
  }

  joinRoomBlock.style.display = room ? 'block' : 'none';
  connectOrDisconnect.value = room ? 'Disconnect' : 'Connect';

  if (room) {
    roomNameText.appendChild(document.createTextNode(room.name));
    room.localParticipant.on('trackDimensionsChanged', function () {
      console.log('local track: trackDimensionsChanged');
    });
    room.localParticipant.on('trackDisabled', function () {
      console.log('local track: trackDisabled');
    });
    room.localParticipant.on('trackEnabled', function () {
      console.log('local track: trackEnabled');
    });
    room.localParticipant.on('trackPublicationFailed', function () {
      console.log('local track: trackPublicationFailed');
    });
    room.localParticipant.on('trackPublished', function () {
      console.log('local track: trackPublished');
    });
    room.localParticipant.on('trackStarted', function () {
      console.log('local track: trackStarted');
    });
    room.localParticipant.on('trackStopped', function () {
      console.log('local track: trackStopped');
    });
  }
}

// Attach the Track to the DOM.
function attachTrack(track, container) {
  container.appendChild(track.attach());
}

// Attach array of Tracks to the DOM.
function attachTracks(tracks, container) {
  tracks.forEach(function(track) {
    attachTrack(track, container);
  });
}

// Detach given track from the DOM
function detachTrack(track) {
  track.detach().forEach(function(element) {
    element.remove();
  });
}

// A new RemoteTrack was published to the Room.
function trackPublished(publication, container) {
  if (publication.isSubscribed) {
    attachTrack(publication.track, container);
  }
  publication.on('subscribed', function(track) {
    console.log('Subscribed to ' + publication.kind + ' track');
    track.on('disabled', function() {
      console.log('Disabled ' + publication.kind + ' track');
    });

    track.on('enabled', function() {
      console.log('Enabled ' + publication.kind + ' track');
    });

    track.on('started', function() {
      console.log('started ' + publication.kind + ' track');
    });

    track.on('dimensionsChanged', function() {
      console.log('dimensionsChanged ' + publication.kind + ' track');
    });

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

  participant.on('trackDimensionsChanged', function() {
    console.log('remote : trackDimensionsChanged');
  });
  participant.on('trackDisabled', function() {
    console.log('remote : trackDisabled');
  });
  participant.on('trackEnabled', function() {
    console.log('remote : trackEnabled');
  });
  participant.on('trackMessage', function() {
    console.log('remote : trackMessage');
  });
  participant.on('trackPublished', function() {
    console.log('remote : trackPublished');
  });
  participant.on('trackStarted', function() {
    console.log('remote : trackStarted');
  });
  participant.on('trackSubscribed', function() {
    console.log('remote : trackSubscribed');
  });
  participant.on('trackSubscriptionFailed', function() {
    console.log('remote : trackSubscriptionFailed');
  });
  participant.on('trackUnpublished', function() {
    console.log('remote : trackUnpublished');
  });
  participant.on('trackUnsubscribed', function() {
    console.log('remote : trackUnsubscribed');
  });
}

// Detach the Participant's Tracks from the DOM.
function participantDisconnected(participant) {
  console.log("Participant '" + participant.identity + "' joined the room");
  const participantDiv = document.getElementById(participant.sid);
  participantDiv.parentNode.removeChild(participantDiv);
}

// Load the code snippet.
getSnippet('./helpers.js').then(function(snippet) {
  var pre = document.querySelector('pre.language-javascript');
  pre.innerHTML = Prism.highlight(snippet, Prism.languages.javascript);
});

// before quering for devices, we need to get media permssions
// without media permissions ios does not return the labels (like front camera, back camera) for the devices.
getMediaPermissions().then(function() {
  // Build the list of available media devices.
  updateDeviceSelectionOptions();

  // Whenever a media device is added or removed, update the list.
  navigator.mediaDevices.ondevicechange = updateDeviceSelectionOptions;

  // Apply the selected audio input media device.
  document.querySelector('button#audioinputapply').onclick = function(event) {
    var audio = document.querySelector('audio#audioinputpreview');
    var waveformContainer = document.querySelector('div#audioinputwaveform');

    applyAudioInputDeviceSelection(deviceSelections.audioinput.value, audio).then(function() {
      var canvas = waveformContainer.querySelector('canvas');
      waveform.setStream(audio.srcObject);
      if (!canvas) {
        waveformContainer.appendChild(waveform.element);
      }
    });

    event.preventDefault();
    event.stopPropagation();
  };

  // Apply the selected audio output media device.
  // NOTE: safari does not let us query the output device (and its HTMLAudioElement does not have setSinkId)
  document.querySelector('button#audiooutputapply').onclick = function(event) {
    console.log('applying audio output');
    var audio = document.querySelector('audio#audioinputpreview');
    applyAudioOutputDeviceSelection(deviceSelections.audiooutput.value, audio, someRoom);
    event.preventDefault();
    event.stopPropagation();
  };

  // Apply the selected video input media device.
  document.querySelector('button#videoinputapply').onclick = function(event) {
    try {
      var video = document.querySelector('video#videoinputpreview');
      applyVideoInputDeviceSelection(deviceSelections.videoinput.value, video, someRoom);
      event.preventDefault();
      event.stopPropagation();
    } catch (error) {
      console.log('videoInput apply failed:', error);
    }
  };

  // Disconnect from the Room on page unload.
  window.onbeforeunload = function() {
    if (someRoom) {
      someRoom.disconnect();
      someRoom = null;
    }
  };

  // Apply the selected video input media device.
  connectOrDisconnect.onclick = async function(event) {
    try {
      connectOrDisconnect.disabled = true;
      event.preventDefault();
      event.stopPropagation();
      if (someRoom) {
        someRoom.disconnect();
        someRoom = null;
      } else {
        const creds = await getRoomCredentials();
        someRoom = await Video.connect(creds.token, {
          name: 'maks',
          // logLevel: 'debug'
        });

        someRoom.participants.forEach(participantConnected);

        // When a Participant joins the Room, log the event.
        someRoom.on('participantConnected', participantConnected);

        // When a Participant leaves the Room, detach its Tracks.
        someRoom.on('participantDisconnected', participantDisconnected);
      }
      setRoom(someRoom);
      connectOrDisconnect.disabled = false;
    } catch (error) {
      console.log('videoInput apply failed:', error);
    }
  };


}).catch(function() {
  console.error("Error : ", error);
});

