'use strict';

/**
 * Listen to Room reconnection events and update the UI accordingly.
 * @param {Room} room - The Room you have joined
 * @param {function} updateRoomState - Updates the app UI with the new state
 * @returns {void}
 */

 function remoteReconnectionUpdates (room, updateRemoteState) {
   console.log(`${room} state is`,room.state)
  room.on('participantReconnecting', remoteParticipant => {
    if (remoteParticipant.state === 'reconnecting') {
      console.log('Remote Participant is Reconnecting')
    }
    updateRemoteState(remoteParticipant.state)
  })

  room.on('participantReconnected', remoteParticipant => {
    if (remoteParticipant.state === 'connected') {
      console.log('Remote Participant is reconnected')
    }
    updateRemoteState(remoteParticipant.state)
  })

  room.on('participantDisconnected', remoteParticipant => {
    if (remoteParticipant.state === 'disconnected') {
      console.log('Remote Participant is disconnected')
    }
    updateRemoteState(remoteParticipant.state)
  })
 }

exports.remoteReconnectionUpdates = remoteReconnectionUpdates;
