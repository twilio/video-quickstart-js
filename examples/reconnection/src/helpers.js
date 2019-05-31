'use strict';

/**
 * Listen to Room reconnection events and update the UI accordingly.
 * @param {Room} room - The Room you have joined
 * @param {function} updateRoomState - Updates the app UI with the new Room state
 * @returns {void}
 */
function setupReconnectionUpdates(room, updateRoomState) {
  room.on('disconnected', (room, error) => {
    if (error.code === 20104) {
      console.log('Signaling reconnection failed due to expired AccessToken!');
    } else if (error.code === 53000) {
      console.log('Signaling reconnection attempts exhausted!');
    } else if (error.code === 53204) {
      console.log('Signaling reconnection took too long!');
    }
    updateRoomState(room.state);
  });

  room.on('reconnected', function() {
    console.log('Reconnected to the Room!');
    updateRoomState(room.state);
  });

  room.on('reconnecting', function(error) {
    if (error.code === 53001) {
      console.log('Reconnecting your signaling connection!', error.message);
    } else if (error.code === 53405) {
      console.log('Reconnecting your media connection!', error.message);
    }
    updateRoomState(room.state);
  });
}

exports.setupReconnectionUpdates = setupReconnectionUpdates;
