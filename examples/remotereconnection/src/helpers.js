'use strict';

/**
 * Listen to Room reconnection events and update the UI accordingly.
 * @param {Room} room - The Room you have joined
 * @param {function} updateRoomState - Updates the app UI with the new state
 * @returns {void}
 */

 function handleRemoteParticipantReconnectionUpdates(room, updateParticipantState) {
  room.on('participantReconnecting', participant => {
    updateParticipantState(participant.state);
  });

  room.on('participantReconnected', participant => {
    updateParticipantState(participant.state);
  });
}

function handleLocalParticipantReconnectionUpdates(room, updateParticipantState) {
  const localParticipant = room.localParticipant;

  localParticipant.on('reconnecting', () => {
    updateParticipantState(localParticipant.state);
  });

  localParticipant.on('reconnected', () => {
    updateParticipantState(localParticipant.state);
  });
} 

exports.handleLocalParticipantReconnectionUpdates = handleLocalParticipantReconnectionUpdates;
exports.handleRemoteParticipantReconnectionUpdates = handleRemoteParticipantReconnectionUpdates;
