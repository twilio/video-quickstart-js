'use strict';

/**
 * Complete the current room.
 * @param $modal - modal for composition check.
 * @param room - current room object.
 */
 async function completeRoom($modal, room){
     const compositionChecked = $('#compositionCheck', $modal).is(':checked');
     await fetch(`/completeroom?roomSid=${room.sid}&composition=${compositionChecked}`, {
         method: 'PUT'
        });
    }

module.exports = completeRoom;