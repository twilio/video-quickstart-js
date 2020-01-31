'use strict';

/** 
  * Get the Tracks of the given Participant.
  * @param {string} participant - A participant to get tracks
*/
function getTracks(participant) {
  return Array.from(participant.tracks.values()).filter(function(publication) {
    return publication.track;
  }).map(function(publication){
    return publication.track;
  });
}

/**
  * Enable and disable tracks.
*/

 function muteAudio(localUser, mute) {
  console.log('muting audio')
  getTracks(localUser).forEach(function(track) {
    if (track.kind === 'audio') {
      if (mute) {
        track.disable();
      } else {
        track.enable();
      }
    }
  });
 }

 function muteVideo(localUser, mute) {
   console.log('mute video')
  getTracks(localUser).forEach(function(track) {
    if (track.kind === 'video') {
      if (mute) {
        track.disable();
      } else {
        track.enable();
      }
    }
  });
 }

exports.muteAudio = muteAudio;
exports.muteVideo = muteVideo;