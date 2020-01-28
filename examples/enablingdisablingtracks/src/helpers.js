'use strict';

var Video = require('twilio-video');

/**
 * Display local video and audio in the given HTMLVideoElement.
 * @param {string} token - Token for joining the Room
 * @param {string} roomName - Room name to join
 * @returns {CancelablePromise<Room>}
 */

function connectToRoom(token, roomName) {
  return Video.connect(token, {
    name: roomName
  });
}

/**
 * Enable and disable audio tracks
 */

 function enableAudio() {}

 function disableAudio() {}

/**
 * Enable and disable video tracks
 */

 function enableVideo() {}

 function disableVideo(){}

 exports.connectToRoom = connectToRoom;
 exports.enableAudio = enableAudio;
 exports.disableAudio = disableAudio;
 exports.enableVideo = enableVideo;
 exports.disableVideo = disableVideo;