/* eslint-disable no-console */
'use strict';

var Video = require('twilio-video');

var activeRoom = {
  'A': null,
  'B': null,
};
window.activeRoom = activeRoom;

function start(roomid) {
  var previewTracks;
  var identity;
  function getElement(elementId) {
    var room = roomid === 'A'  ? '' : 'B';
    return document.getElementById(elementId + room);
  }

  // Attach the Track to the DOM.
  function attachTrack(track, container) {
    if (track.kind === 'data') {
      track.on('message', data => {
        console.log('makarand, got data: ' + data);
        log('received ' + data);
      });
    } else {
      container.appendChild(track.attach());
    }
  }

  // Attach array of Tracks to the DOM.
  function attachTracks(tracks, container) {
    tracks.forEach(function(track) {
      attachTrack(track, container);
    });
  }

  // Detach given track from the DOM
  function detachTrack(track) {
    if (track.kind !== 'data') {
      track.detach().forEach(function(element) {
        element.remove();
      });
    }
  }

  // A RemoteTrack was unpublished from the Room.
  function trackUnpublished(publication) {
    log(publication.kind + ' track was unpublished.');
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
  function participantConnected(participant, container) {
    participant.tracks.forEach(function(publication) {
      trackPublished(publication, container);
    });
    participant.on('trackPublished', function(publication) {
      trackPublished(publication, container);
    });
    participant.on('trackUnpublished', trackUnpublished);
  }

  // Detach the Participant's Tracks from the DOM.
  function detachParticipantTracks(participant) {
    var tracks = getTracks(participant);
    tracks.forEach(detachTrack);
  }
  // const dataTrack = new Video.LocalDataTrack();
  // const dataTrackPublished = {};
  // dataTrackPublished.promise = new Promise((resolve, reject) => {
  //   dataTrackPublished.resolve = resolve;
  //   dataTrackPublished.reject = reject;
  // });

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
        // tracks: [dataTrack]
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
  });

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
    activeRoom[roomid] = room;

    log('Joined as \'' + identity + '\'');
    getElement('button-join').style.display = 'none';
    getElement('button-leave').style.display = 'inline';

    // Attach LocalParticipant's Tracks, if not already attached.
    var previewContainer = getElement('local-media');
    if (!previewContainer.querySelector('video')) {
      attachTracks(getTracks(room.localParticipant), previewContainer);
    }

    // Attach the Tracks of the Room's Participants.
    var remoteMediaContainer = getElement('remote-media');
    room.participants.forEach(function(participant) {
      log('Already in Room: \'' + participant.identity + '\'');
      participantConnected(participant, remoteMediaContainer);
    });

    // When a Participant joins the Room, log the event.
    room.on('participantConnected', function(participant) {
      log('Joining: \'' + participant.identity + '\'');
      participantConnected(participant, remoteMediaContainer);
    });

    // When a Participant leaves the Room, detach its Tracks.
    room.on('participantDisconnected', function(participant) {
      log('RemoteParticipant \'' + participant.identity + '\' left the room');
      detachParticipantTracks(participant);
    });

    // Once the LocalParticipant leaves the room, detach the Tracks
    // of all Participants, including that of the LocalParticipant.
    room.on('disconnected', function() {
      log('Left');
      if (previewTracks) {
        previewTracks.forEach(function(track) {
          track.stop();
        });
        previewTracks = null;
      }
      detachParticipantTracks(room.localParticipant);
      room.participants.forEach(detachParticipantTracks);
      activeRoom[roomid] = null;
      getElement('button-join').style.display = 'inline';
      getElement('button-leave').style.display = 'none';
    });
  }
  // Preview LocalParticipant's Tracks.
  getElement('button-preview').onclick = function() {
    var localTracksPromise = previewTracks
      ? Promise.resolve(previewTracks)
      : Video.createLocalTracks();

    localTracksPromise.then(function(tracks) {
      // window.previewTracks = previewTracks = tracks;
      var previewContainer = getElement('local-media');
      if (!previewContainer.querySelector('video')) {
        attachTracks(tracks, previewContainer);
      }
    }, function(error) {
      console.error('Unable to access local media', error);
      log('Unable to access Camera and Microphone');
    });
  };

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
      activeRoom[roomid] = null;
    }
  }
}

start('A');
start('B');
