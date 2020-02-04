'use strict';

/**
 * Mute/unmute your media in a Room.
 * @param {Room} room - The Room you have joined
 * @param {'audio'|'video'} kind - The type of media you want to mute/unmute
 * @param {'mute'|'unmute'} action - Whether you want to mute/unmute
 */
function muteOrUnmuteYourMedia(room, kind, action) {
  const publications = kind === 'audio'
    ? room.localParticipant.audioTracks
    : room.localParticipant.videoTracks;

  publications.forEach(function(publication) {
    if (action === 'mute') {
      publication.track.disable();
    } else {
      publication.track.enable();
    }
  });
}

/**
 * Mute your audio in a Room.
 * @param {Room} room - The Room you have joined
 * @returns {void}
 */
function muteYourAudio(room) {
  muteOrUnmuteYourMedia(room, 'audio', 'mute');
}

/**
 * Mute your video in a Room.
 * @param {Room} room - The Room you have joined
 * @returns {void}
 */
function muteYourVideo(room) {
  muteOrUnmuteYourMedia(room, 'video', 'mute');
}

/**
 * Unmute your audio in a Room.
 * @param {Room} room - The Room you have joined
 * @returns {void}
 */
function unmuteYourAudio(room) {
  muteOrUnmuteYourMedia(room, 'audio', 'unmute');
}

/**
 * Unmute your video in a Room.
 * @param {Room} room - The Room you have joined
 * @returns {void}
 */
function unmuteYourVideo(room) {
  muteOrUnmuteYourMedia(room, 'video', 'unmute');
}

/**
 * A RemoteParticipant muted or unmuted its media.
 * @param {Room} room - The Room you have joined
 * @param {function} onMutedMedia - Called when a RemoteParticipant muted its media
 * @param {function} onUnmutedMedia - Called when a RemoteParticipant unmuted its media
 * @returns {void}
 */
function participantMutedOrUnmutedMedia(room, onMutedMedia, onUnmutedMedia) {
  room.on('trackSubscribed', function(track, publication, participant) {
    track.on('disabled', function() {
      return onMutedMedia(track, participant);
    });
    track.on('enabled', function() {
      return onUnmutedMedia(track, participant);
    });
  });
}

exports.muteYourAudio = muteYourAudio;
exports.muteYourVideo = muteYourVideo;
exports.unmuteYourAudio = unmuteYourAudio;
exports.unmuteYourVideo = unmuteYourVideo;
exports.participantMutedOrUnmutedMedia = participantMutedOrUnmutedMedia;
