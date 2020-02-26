'use strict';

/**
 * Listen to RemoteParticipant reconnection events and update the UI accordingly.
 * @param {Room} room - The Room you have joined
 * @param {function} updateRoomState - Updates the app UI with the new state
 * @returns {void}
 */
function handleRemoteParticipantReconnectionUpdates(room, updateParticipantState) {
  room.on('participantReconnecting', function(participant) {
    updateParticipantState(participant.state);
  });

  room.on('participantReconnected', function(participant) {
    updateParticipantState(participant.state);
  });
}

/**
 * Listen to LocalParticipant reconnection events and update the UI accordingly.
 * @param {Room} room - The Room you have joined
 * @param {function} updateRoomState - Updates the app UI with the new state
 * @returns {void}
 */
function handleLocalParticipantReconnectionUpdates(room, updateParticipantState) {
  const localParticipant = room.localParticipant;

  localParticipant.on('reconnecting', function() {
    updateParticipantState(localParticipant.state);
  });

  localParticipant.on('reconnected', function() {
    updateParticipantState(localParticipant.state);
  });
} 

exports.handleLocalParticipantReconnectionUpdates = handleLocalParticipantReconnectionUpdates;
exports.handleRemoteParticipantReconnectionUpdates = handleRemoteParticipantReconnectionUpdates;
