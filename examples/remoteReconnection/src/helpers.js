'use strict';

/**
 * Listen to Room reconnection events and update the UI accordingly.
 * @param {Room} room - The Room you have joined
 * @param {function} updateRoomState - Updates the app UI with the new Room state
 * @returns {void}
 */

 function remoteReconnectionUpdates (room, updateRemoteState) {
  room.on('participantReconnecting', remoteParticipant => {
    if (remoteParticipant.state === 'reconnecting') {
      console.log('Remote Participant is Reconnecting')
    }
    // Make UI reconnecting bar orange here
    updateRemoteState(remoteParticipant.state)
  })

  room.on('participantReconnected', remoteParticipant => {
    if (remoteParticipant.state === 'connected') {
      console.log('Remote Participant is reconnected')
    }
    // Make UI connected bar green here
    updateRemoteState(remoteParticipant.state)
  })
 }

exports.remoteReconnectionUpdates = remoteReconnectionUpdates;
