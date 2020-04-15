'use strict';

const { connect } = require('twilio-video');
const { isMobile } = require('./browser');

const $leave = $('#leave-room');
const $room = $('#room');
const $activeParticipant = $('div#active-participant > div.participant.main', $room);
const $activeVideo = $('video', $activeParticipant);
const $participants = $('div#participants', $room);

// The current active Participant in the Room.
let activeParticipant = null;

// Whether the user has selected the active Participant by clicking on
// one of the video thumbnails.
let isActiveParticipantPinned = false;

/**
 * Set the active Participant's video.
 * @param participant - the active Participant
 */
function setActiveParticipant(participant) {
  if (activeParticipant) {
    const $activeParticipant = $(`[data-identity="${activeParticipant.identity}"]`, $participants);
    $activeParticipant.removeClass('active');
    $activeParticipant.removeClass('pinned');
  }
  activeParticipant = participant;

  const $participant = $(`[data-identity="${participant.identity}"]`, $participants);
  $participant.addClass('active');
  if (isActiveParticipantPinned) {
    $participant.addClass('pinned');
  }

  const $video = $('video', $participant);
  $activeVideo.css('opacity', $video.css('opacity'));
  $activeVideo.get(0).srcObject = $video.get(0).srcObject;
  $activeParticipant.attr('data-identity', participant.identity);
}

/**
 * Set the current active Participant in the Room.
 * @param room - the Room which contains the current active Participant
 */
function setCurrentActiveParticipant(room) {
  const { dominantSpeaker, localParticipant } = room;
  setActiveParticipant(dominantSpeaker || localParticipant);
}

/**
 * Set the VideoTrack priority for the given RemoteParticipant. This has no
 * effect in Peer-to-Peer Rooms.
 * @param participant - the RemoteParticipant whose VideoTrack priority is to be set
 * @param priority - null | 'low' | 'standard' | 'high'
 */
function setVideoPriority(participant, priority) {
  participant.videoTracks.forEach(publication => {
    const track = publication.track;
    if (track && track.setPriority) {
      track.setPriority(priority);
    }
  });
}

/**
 * Attach a Track to the DOM.
 * @param track - the Track to attach
 * @param participant - the Participant which published the Track
 */
function attachTrack(track, participant) {
  if (track.kind === 'audio') {
    attachAudioTrack(track);
  } else if (track.kind === 'video') {
    attachVideoTrack(track, participant);
  }
}

/**
 * Attach an AudioTrack to the DOM.
 * @param track - the AudioTrack to attach
 */
function attachAudioTrack(track) {
  const audioElement = track.attach();
  $participants.append(audioElement);
}

/**
 * Attach a VideoTrack to the DOM.
 * @param track - the VideoTrack to attach
 * @param participant - the Participant which published the Track
 */
function attachVideoTrack(track, participant) {
  const $container = $(`<div class="participant" data-identity="${participant.identity}"></div>`);
  $participants.append($container);

  const videoElement = track.attach();
  videoElement.style.width = '100%';
  $container.append(videoElement);

  // When the RemoteParticipant disables the VideoTrack, hide the <video> element.
  track.on('disabled', () => {
    videoElement.style.opacity = '0';
    if (participant === activeParticipant) {
      $activeVideo.css('opacity', '0');
    }
  });

  // When the RemoteParticipant enables the VideoTrack, show the <video> element.
  track.on('enabled', () => {
    videoElement.style.opacity = '';
    if (participant === activeParticipant) {
      $activeVideo.css('opacity', '');
    }
  });

  // Toggle the pinning of the active Participant's video.
  $container.on('click', () => {
    if (activeParticipant === participant && isActiveParticipantPinned) {
      // Unpin the RemoteParticipant and update the current active Participant.
      setVideoPriority(participant, null);
      isActiveParticipantPinned = false;
      setCurrentActiveParticipant(window.room);
    } else {
      // Pin the RemoteParticipant as the active Participant.
      if (isActiveParticipantPinned) {
        setVideoPriority(activeParticipant, null);
      }
      setVideoPriority(participant, 'high');
      isActiveParticipantPinned = true;
      setActiveParticipant(participant);
    }
  });
}

/**
 * Detach a Track from the DOM.
 * @param track
 * @param participant - the Participant which published the Track
 */
function detachTrack(track, participant) {
  track.detach().forEach(mediaElement => mediaElement.remove());
  if (track.kind === 'video') {
    $(`[data-identity="${participant.identity}"]`, $participants).remove();
  }
}

/**
 * Subscribe to the RemoteParticipant's media.
 * @param participant - the RemoteParticipant
 */
function participantConnected(participant) {
  // Subscribe to the RemoteTrackPublications already published by the
  // RemoteParticipant.
  participant.tracks.forEach(publication => {
    trackPublished(publication, participant);
  });

  // Subscribe to the RemoteTrackPublications that will be published by
  // the RemoteParticipant later.
  participant.on('trackPublished', publication => {
    trackPublished(publication, participant);
  });
}

/**
 * Subscribe to the RemoteTrackPublication's media.
 * @param publication - the RemoteTrackPublication
 * @param participant - the publishing RemoteParticipant
 */
function trackPublished(publication, participant) {
  // If the RemoteTrackPublication is already subscribed to, then
  // attach the RemoteTrack to the DOM.
  if (publication.track) {
    attachTrack(publication.track, participant);
  }

  // Once the RemoteTrackPublication is subscribed to, attach the
  // RemoteTrack to the DOM.
  publication.on('subscribed', track => {
    attachTrack(track, participant);
  });

  // Once the RemoteTrackPublication is unsubscribed from, detach the
  // RemoteTrack from the DOM.
  publication.on('unsubscribed', track => {
    detachTrack(track, participant);
  });
}

/**
 * Join a Room.
 * @param token - the AccessToken used to join a Room
 * @param connectOptions - the ConnectOptions used to join a Room
 */
async function joinRoom(token, connectOptions) {
  // Join to the Room with the given AccessToken and ConnectOptions.
  const room = await connect(token, connectOptions);

  // Make the Room available in the JavaScript console for debugging.
  window.room = room;

  // Find the LocalVideoTrack from the Room's LocalParticipant.
  const localVideoTrack = Array.from(room.localParticipant.videoTracks.values())[0].track;

  // Start the local video preview.
  attachVideoTrack(localVideoTrack, room.localParticipant);

  // Subscribe to the media published by RemoteParticipants already in the Room.
  room.participants.forEach(participantConnected);

  // Subscribe to the media published by RemoteParticipants joining the Room later.
  room.on('participantConnected', participantConnected);

  // If the disconnected RemoteParticipant was pinned as the active Participant,
  // then unpin it so that the active Participant can be updated.
  room.on('participantDisconnected', participant => {
    if (activeParticipant === participant && isActiveParticipantPinned) {
      isActiveParticipantPinned = false;
      setCurrentActiveParticipant(room);
    }
  });

  // Set the current active Participant.
  setCurrentActiveParticipant(room);

  // Update the active Participant when changed, only if the user has not
  // pinned any particular Participant as the active Participant.
  room.on('dominantSpeakerChanged', () => {
    if (!isActiveParticipantPinned) {
      setCurrentActiveParticipant(room);
    }
  });

  // Leave the Room when the "Leave Room" button is clicked.
  $leave.click(function onLeave() {
    $leave.off('click', onLeave);
    room.disconnect();
  });

  return new Promise((resolve, reject) => {
    // Leave the Room when the "beforeunload" event is fired.
    window.onbeforeunload = () => {
      room.disconnect();
    };

    if (isMobile) {
      // TODO(mmalavalli): investigate why "pagehide" is not working in iOS Safari.
      // In iOS Safari, "beforeunload" is not fired, so use "pagehide" instead.
      window.onpagehide = () => {
        room.disconnect();
      };

      // On mobile browsers, use "visibilitychange" event to determine when
      // the app is backgrounded or foregrounded.
      document.onvisibilitychange = () => {
        if (document.visibilityState === 'hidden') {
          // When the app is backgrounded, your app can no longer capture
          // video frames. So, disable the LocalVideoTrack.
          localVideoTrack.disable();
        } else {
          // When the app is foregrounded, your app can now continue to
          // capture video frames. So, enable the LocalVideoTrack.
          localVideoTrack.enable();
        }
      };
    }

    room.once('disconnected', (room, error) => {
      // Clear the event handlers on document and window..
      window.onbeforeunload = null;
      if (isMobile) {
        window.onpagehide = null;
        document.onvisibilitychange = null;
      }

      // Stop the local video preview.
      detachTrack(localVideoTrack, room.localParticipant);

      // Stop the active Participant video.
      $activeVideo.get(0).srcObject = null;

      // Clear the Room reference used for debugging from the JavaScript console.
      window.room = null;

      if (error) {
        // Reject the Promise with the TwilioError so that the Room selection
        // modal (plus the TwilioError message) can be displayed.
        reject(error);
      } else {
        // Resolve the Promise so that the Room selection modal can be
        // displayed.
        resolve();
      }
    });
  });
}

module.exports = joinRoom;
