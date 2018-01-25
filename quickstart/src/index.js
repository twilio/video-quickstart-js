'use strict';

var Video = require('twilio-video');

var activeRoom;
var previewTracks;
var identity;
var roomName;
var IS_STREAMER = false;
var screenShareId;

$("#activate-stream").click(function() {
    IS_STREAMER = true;
})

// Attach the Tracks to the DOM.
function attachTracks(tracks, container) {
  tracks.forEach(function(track) {
    container.appendChild(track.attach());
  });
}

// Attach the Participant's Tracks to the DOM.
function attachParticipantTracks(participant, container) {
  var tracks = Array.from(participant.tracks.values());
    var firstVideoTrack = true;
    tracks.forEach(function(track) {
        if (track.kind === "video") {
            if (firstVideoTrack) {
                attachTracks([track], document.getElementById('video-stream-1'))
                firstVideoTrack = false;
            } else {
                attachTracks([track], document.getElementById('video-stream-2'))
            }
        }
    })
}

// Detach the Tracks from the DOM.
function detachTracks(tracks) {
  tracks.forEach(function(track) {
    track.detach().forEach(function(detachedElement) {
      detachedElement.remove();
    });
  });
}

// Detach the Participant's Tracks from the DOM.
function detachParticipantTracks(participant) {
  var tracks = Array.from(participant.tracks.values());
  detachTracks(tracks);
}

// When we are about to transition away from this page, disconnect
// from the room, if joined.
window.addEventListener('beforeunload', leaveRoomIfJoined);

// Obtain a token from the server in order to connect to the Room.
$.getJSON('/token', function(data) {
  identity = data.identity;
  // Bind button to join Room.
  document.getElementById('button-join').onclick = function() {
    roomName = document.getElementById('room-name').value;
    if (!roomName) {
      alert('Please enter a room name.');
      return;
    }

    log("Joining room '" + roomName + "'...");
    var connectOptions = {
      name: roomName,
      logLevel: 'debug'
    };

    if (previewTracks) {
      connectOptions.tracks = previewTracks;
    }

    // Join the Room with the token from the server and the
    // LocalParticipant's Tracks.
      //Video.connect(data.token, connectOptions).then(roomJoined, function(error) {
      //log('Could not connect to Twilio: ' + error.message);
      // });

      // test screen share
      Video.connect(data.token, {
          name: roomName,
          tracks: IS_STREAMER ? previewTracks : []
      }).then(function(room) {
          // Need to replace extension id here ------>
          // Maria:   ckgnaeohbcodmadmmnilmfeidecicpdn
          // Jackson: oekhbnepgdpgjbegkpheihipdingedin
          // Ben:     oekhbnepgdpgjbegkpheihipdingedin
          if (IS_STREAMER) {
              getUserScreen(['window', 'screen', 'tab'], 'oekhbnepgdpgjbegkpheihipdingedin').then(function(stream) {
                  var screenLocalTrack = new Video.LocalVideoTrack(stream.getVideoTracks()[0]);

                  /*  screenLocalTracks.once('stopped', () => {*/
                  //// Handle "stopped" event.
                  /*});*/

                  room.localParticipant.publishTrack(screenLocalTrack);

                  roomJoined(room);
              })
          } else {
                  roomJoined(room);
          }
      })
  };

  // Bind button to leave Room.
  document.getElementById('button-leave').onclick = function() {
    log('Leaving room...');
    activeRoom.disconnect();
  };
});

/*
 const { connect, LocalVideoTrack } = Video;

	// Option 1. Provide the screenLocalTrack when connecting.
	async function option1(token) {
  	const stream = await getUserScreen(['window', 'screen', 'tab'], 'ckgnaeohbcodmadmmnilmfeidecicpdn');
  	const screenLocalTrack = new LocalVideoTrack(stream.getVideoTracks()[0]);

  screenLocalTracks.once('stopped', () => {
    // Handle "stopped" event.
  })

  const room = await connect(token, {
    name: roomName,
    tracks: [screenLocalTrack]
  });

  return room;
}

*/

/**
 * Get a MediaStream containing a MediaStreamTrack that represents the user's
 * screen.
 *
 * This function sends a "getUserScreen" request to our Chrome Extension which,
 * if successful, responds with the sourceId of one of the specified sources. We
 * then use the sourceId to call getUserMedia.
 *
 * @param {Array<DesktopCaptureSourceType>} sources
 * @param {string} extensionId
 * @returns {Promise<MediaStream>} stream
 */
function getUserScreen(sources, extensionId) {
  const request = {
    type: 'getUserScreen',
    sources: sources
  };
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(extensionId, request, response => {
      switch (response && response.type) {
        case 'success':
          resolve(response.streamId);
          break;

        case 'error':
          reject(new Error(error.message));
          break;

        default:
          reject(new Error('Unknown response'));
          break;
      }
    });
  }).then(streamId => {
    return navigator.mediaDevices.getUserMedia({
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: streamId,
          // You can provide additional constraints. For example,
          maxWidth: 1920,
          maxHeight: 1080,
          maxFrameRate: 10,
          minAspectRatio: 1.77
        }
      }
    });
  });
}

// Successfully connected!
function roomJoined(room) {
  window.room = activeRoom = room;

  log("Joined as '" + identity + "'");
  document.getElementById('button-join').style.display = 'none';
  document.getElementById('button-leave').style.display = 'inline';

  // Attach LocalParticipant's Tracks, if not already attached.
  var previewContainer = document.getElementById('local-media');
  if (!previewContainer.querySelector('video')) {
    attachParticipantTracks(room.localParticipant, previewContainer);
  }

  // Attach the Tracks of the Room's Participants.
  room.participants.forEach(function(participant) {
    log("Already in Room: '" + participant.identity + "'");
    var previewContainer = document.getElementById('local-media');
    attachParticipantTracks(participant, previewContainer);
  });

  // When a Participant joins the Room, log the event.
  room.on('participantConnected', function(participant) {
    log("Joining: '" + participant.identity + "'");
  });
  var setFirstVideoTrack = false;
  // When a Participant adds a Track, attach it to the DOM.
  room.on('trackAdded', function(track, participant) {
    log(participant.identity + " added track: " + track.kind);
    var container = document.getElementById('local-media');

      if (track.kind === "video") {
          if (!setFirstVideoTrack) {
            container = document.getElementById('video-stream-1');
            setFirstVideoTrack = true;
          } else {
             container = document.getElementById('video-stream-2');
             setFirstVideoTrack = false;
          }

      }
    attachTracks([track], container);
  });

  // When a Participant removes a Track, detach it from the DOM.
  room.on('trackRemoved', function(track, participant) {
    log(participant.identity + " removed track: " + track.kind);
    detachTracks([track]);
  });

  // When a Participant leaves the Room, detach its Tracks.
  room.on('participantDisconnected', function(participant) {
    log("Participant '" + participant.identity + "' left the room");
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
    }
    detachParticipantTracks(room.localParticipant);
    room.participants.forEach(detachParticipantTracks);
    activeRoom = null;
    document.getElementById('button-join').style.display = 'inline';
    document.getElementById('button-leave').style.display = 'none';
  });
}

// Preview LocalParticipant's Tracks.
// document.getElementById('button-preview').onclick = function() {
//   var localTracksPromise = previewTracks
//     ? Promise.resolve(previewTracks)
//     : Video.createLocalTracks();

//   localTracksPromise.then(function(tracks) {
//     window.previewTracks = previewTracks = tracks;
//     var previewContainer = document.getElementById('local-media');
//     if (!previewContainer.querySelector('video')) {
//       attachTracks(tracks, previewContainer);
//     }
//   }, function(error) {
//     console.error('Unable to access local media', error);
//     log('Unable to access Camera and Microphone');
//   });
// };

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


// ----- PAGE NAVIGATION -----

const gotToHomePage = () => {
  document.getElementById('chat-page').style.display = 'none';
  document.getElementById('home-page').style.display = 'block';
};

const gotToRoomPage = () => {
  document.getElementById('home-page').style.display = 'none';
  document.getElementById('chat-page').style.display = 'flex';
}

document.getElementById('logo-title-container').onclick = gotToHomePage;

document.getElementById('go-to-room-page').onclick = gotToRoomPage;






