'use strict';

const { connect } = require('twilio-video');
const { isMobile, name } = require('./browser');

/**
 * Attach a Track to the DOM.
 * @param track - the Track to attach
 * @param participant - the Participant which published the Track
 * @param $participants - the DOM container
 */
function attachTrack(track, participant, $participants) {
  if (track.kind === 'audio') {
    const audioElement = track.attach();
    $participants.append(audioElement);
  } else {
    const $container = $(`<div class="participant" data-identity="${participant.identity}"></div>`);
    $participants.append($container);
    const videoElement = track.attach();
    videoElement.style.width = '100%';
    $container.append(videoElement);
  }
}

/**
 * Detach a Track from the DOM.
 * @param track
 * @param participant - the Participant which published the Track
 * @param $participants - the DOM container
 */
function detachTrack(track, participant, $participants) {
  track.detach().forEach(mediaElement => mediaElement.remove());
  $(`[data-identity="${participant.identity}"]`, $participants).remove();
}

/**
 * Subscribe to the RemoteParticipant's media.
 * @param participant - the RemoteParticipant
 * @param $participants - the DOM container
 */
function participantConnected(participant, $participants) {
  // Subscribe to the RemoteTrackPublications already published by the
  // RemoteParticipant.
  participant.tracks.forEach(publication => {
    trackPublished(publication, participant, $participants);
  });

  // Subscribe to the RemoteTrackPublications that will be published by
  // the RemoteParticipant later.
  participant.on('trackPublished', publication => {
    trackPublished(publication, participant, $participants);
  });
}

/**
 * Subscribe to the RemoteTrackPublication's media.
 * @param publication - the RemoteTrackPublication
 * @param participant - the publishing RemoteParticipant
 * @param $participants - the DOM container
 */
function trackPublished(publication, participant, $participants) {
  // If the RemoteTrackPublication is already subscribed to, then
  // attach the RemoteTrack to the DOM.
  if (publication.track) {
    attachTrack(publication.track, participant, $participants);
  }

  // Once the RemoteTrackPublication is subscribed to, attach the
  // RemoteTrack to the DOM.
  publication.on('subscribed', track => {
    attachTrack(track, participant, $participants);
  });

  // Once the RemoteTrackPublication is unsubscribed from, detach the
  // RemoteTrack from the DOM.
  publication.on('unsubscribed', track => {
    detachTrack(track, participant, $participants);
  });
}

/**
 * Join a Room.
 * @param token - the AccessToken used to join a Room
 * @param connectOptions - the ConnectOptions used to join a Room
 * @param $room - the DOM container for the quick start's UI
 * @param $leave - the button for leaving the Room
 */
function joinRoom(token, connectOptions, $room, $leave) {
  const $participants = $('#participants', $room);
  return connect(token, connectOptions).then(room => {
    window.room = room;

    // Find the LocalVideoTrack from the Room's LocalParticipant.
    const localVideoTrack = Array.from(room.localParticipant.videoTracks.values())[0].track;

    // Start the local video preview.
    attachTrack(localVideoTrack, room.localParticipant, $participants);

    // Subscribe to the media published by RemoteParticipants already in the Room.
    room.participants.forEach(participant => {
      participantConnected(participant, $participants);
    });

    // Subscribe to the media published by RemoteParticipants joining the Room later.
    room.on('participantConnected', participant => {
      participantConnected(participant, $participants);
    });

    // Leave the Room when the "Leave Room" button is clicked.
    $leave.click(function onLeave() {
      $leave.off('click', onLeave);
      room.disconnect();
    });

    return new Promise(resolve => {
      if ('onbeforeunload' in window) {
        // Leave the Room when the "beforeunload" event is fired.
        window.addEventListener('beforeunload', () => room.disconnect());
      }

      if (isMobile) {
        // TODO(mmalavalli): investigate why "pagehide" is not working in iOS Safari.
        // In iOS Safari, "beforeunload" is not fired, so use "pagehide" instead.
        if (name === 'safari' && 'onpagehide' in window) {
          window.addEventListener('pagehide', () => room.disconnect());
        }

        // On mobile browsers, use "visibilitychange" event to determine when
        // the app is backgrounded or foregrounded.
        if ('onvisibilitychange' in document) {
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
              // If the app is backgrounded, leave the Room, but do not show
              // the room selection modal.
              room.removeAllListeners('disconnected');
              detachTrack(localVideoTrack, room.localParticipant, $participants);
              room.disconnect();
            } else {
              // If the app is foregrounded, rejoin the Room.
              resolve(joinRoom(token, connectOptions, $room, $leave));
            }
          });
        }
      }

      room.once('disconnected', () => {
        // Stop the local video preview.
        detachTrack(localVideoTrack, room.localParticipant, $participants);
        window.room = null;
        resolve();
      });
    });
  });
}

module.exports = joinRoom;
