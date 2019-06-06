'use strict';

var Video = require('twilio-video');

/**
 * Connect to a Room with the Network Quality API enabled.
 * This API is available only in Small Group or Group Rooms.
 * @param {string} token - Token for joining the Room
 * @param {number} localVerbosity - Verbosity level of Network Quality reports
 *   for the LocalParticipant [1 - 3]
 * @param {number} remoteVerbosity - Verbosity level of Network Quality reports
 *   for the RemoteParticipant(s) [0 - 3]
 * @returns {CancelablePromise<Room>}
 */
function connectToRoomWithNetworkQuality(token, localVerbosity, remoteVerbosity) {
  return Video.connect(token, {
    networkQuality: {
      local: localVerbosity,
      remote: remoteVerbosity
    }
  });
}

/**
 * Listen to changes in the Network Quality report of a Participant and update
 * your application.
 * @param {Participant} participant - The Participant whose updates you want to listen to
 * @param {function} updateNetworkQualityReport - Updates the app UI with the new
 *   Network Quality report of the Participant.
 * @returns {void}
 */
function setupNetworkQualityUpdatesForParticipant(participant, updateNetworkQualityReport) {
  updateNetworkQualityReport(participant);
  participant.on('networkQualityLevelChanged', function() {
    updateNetworkQualityReport(participant);
  });
}

/**
 * Listen to changes in the Network Quality reports and update your application.
 * @param {Room} room - The Room you just joined
 * @param {function} updateNetworkQualityReport - Updates the app UI with the new
 *   Network Quality report of a Participant.
 * @returns {void}
 */
function setupNetworkQualityUpdates(room, updateNetworkQualityReport) {
  // Listen to changes in Network Quality level of the LocalParticipant.
  setupNetworkQualityUpdatesForParticipant(room.localParticipant, updateNetworkQualityReport);
  // Listen to changes in Network Quality levels of RemoteParticipants already
  // in the Room.
  room.participants.forEach(function(participant) {
    setupNetworkQualityUpdatesForParticipant(participant, updateNetworkQualityReport);
  });
  // Listen to changes in Network Quality levels of RemoteParticipants that will
  // join the Room in the future.
  room.on('participantConnected', function(participant) {
    setupNetworkQualityUpdatesForParticipant(participant, updateNetworkQualityReport);
  });
}

/**
 * Change the local and remote Network Quality verbosity levels after joining the Room.
 * @param {Room} room - The Room you just joined
 * @param {number} localVerbosity - Verbosity level of Network Quality reports
 *   for the LocalParticipant [1 - 3]
 * @param {number} remoteVerbosity - Verbosity level of Network Quality reports
 *   for the RemoteParticipant(s) [0 - 3]
 * @returns {void}
 */
function setNetworkQualityConfiguration(room, localVerbosity, remoteVerbosity) {
  room.localParticipant.setNetworkQualityConfiguration({
    local: localVerbosity,
    remote: remoteVerbosity
  });
}

exports.connectToRoomWithNetworkQuality = connectToRoomWithNetworkQuality;
exports.setupNetworkQualityUpdates = setupNetworkQualityUpdates;
exports.setNetworkQualityConfiguration = setNetworkQualityConfiguration;
