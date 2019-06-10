/* eslint-disable no-console */
'use strict';

var Video = require('twilio-video');


var activeRoom = {
  'A': null,
  'B': null,
};
window.activeRoom = activeRoom;

function start(roomid) {
  // A new RemoteTrack was published to the Room.
  function trackPublished(publication) {
    publication.on('subscribed', function(track) {
      console.log('makarand Subscribed to ' + publication.kind + ' track');
      if (track.kind === 'data') {
        track.on('message', data => {
          console.log('makarand, got data: ' + data);
          log('received ' + data);
        });
      }
    });
  }

  // A new RemoteParticipant joined the Room
  function participantConnected(participant) {
    participant.tracks.forEach(function(publication) {
      trackPublished(publication);
    });
    participant.on('trackPublished', function(publication) {
      trackPublished(publication);
    });
  }
  const dataTrack = new Video.LocalDataTrack();
  const dataTrackPublished = {};
  dataTrackPublished.promise = new Promise((resolve, reject) => {
    dataTrackPublished.resolve = resolve;
    dataTrackPublished.reject = reject;
  });

  var identity;
  function getElement(elementId) {
    var room = roomid === 'A'  ? '' : 'B';
    return document.getElementById(elementId + room);
  }

  // When we are about to transition away from this page, disconnect
  // from the room, if joined.
  window.addEventListener('beforeunload', leaveRoomIfJoined);

  // Obtain a token from the server in order to connect to the Room.
  $.getJSON('/token', function(data) {
    identity = data.identity;
    getElement('room-controls').style.display = 'block';

    function joinRoom() {
      let roomName = getElement('room-name').value;
      if (!roomName) {
        alert('Please enter a room name.');
        return;
      }

      log('Joining room \'' + roomName + '\'...');
      var connectOptions = {
        name: roomName,
        logLevel: 'debug',
        tracks: [dataTrack]
      };

      // Join the Room with the token from the server and the
      // LocalParticipant's Tracks.
      Video.connect(data.token, connectOptions).then(roomJoined, function(error) {
        log('Could not connect to Twilio: ' + error.message);
      });
    }

    // Bind button to join Room.
    getElement('button-join').onclick = joinRoom;

    // Bind button to leave Room.
    getElement('button-leave').onclick = function() {
      log('Leaving room ' + roomid + '...');
      activeRoom[roomid].disconnect();
    };

    getElement('button-send').onclick = function() {
      dataTrackPublished.promise.then(() => dataTrack.send(getElement('message').value));
    };
  });

  // Successfully connected!
  function roomJoined(room) {
    activeRoom[roomid] = room;

    log('Joined as \'' + identity + '\'');
    getElement('button-join').style.display = 'none';
    getElement('button-leave').style.display = 'inline';
    getElement('button-send').style.display = 'inline';

    room.participants.forEach(participantConnected);

    // When a Participant joins the Room, log the event.
    room.on('participantConnected', participantConnected);

    room.localParticipant.on('trackPublished', publication => {
      if (publication.track === dataTrack) {
        dataTrackPublished.resolve();
      }
    });

    room.localParticipant.on('trackPublicationFailed', (error, track) => {
      if (track === dataTrack) {
        dataTrackPublished.reject(error);
      }
    });

    // Once the LocalParticipant leaves the room, detach the Tracks
    // of all Participants, including that of the LocalParticipant.
    room.on('disconnected', function() {
      log('Left');
      activeRoom[roomid] = null;
      getElement('button-join').style.display = 'inline';
      getElement('button-leave').style.display = 'none';
      getElement('button-send').style.display = 'none';

    });
  }

  // Activity log.
  function log(message) {
    var logDiv = getElement('log');
    logDiv.innerHTML += '<p>&gt;&nbsp;' + message + '</p>';
    logDiv.scrollTop = logDiv.scrollHeight;
  }

  // Leave Room.
  function leaveRoomIfJoined() {
    if (activeRoom[roomid]) {
      activeRoom[roomid].disconnect();
    }
  }
}

start('A');
start('B');
