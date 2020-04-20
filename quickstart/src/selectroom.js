'use strict';

const { addUrlParams, getUrlParams } = require('./browser');
const getUserFriendlyError = require('./userfriendlyerror');

/**
 * Select your Room name and identity (screen name).
 * @param $modal - modal for selecting your Room name and identity
 * @param error - Error from the previous Room session, if any
 */
function selectRoom($modal, error) {
  const $alert = $('div.alert', $modal);
  const $changeMedia = $('button.btn-dark', $modal);
  const $identity = $('#screen-name', $modal);
  const $join = $('button.btn-primary', $modal);
  const $roomName = $('#room-name', $modal);

  // If Room name is provided as a URL parameter, pre-populate the Room name field.
  const { roomName } = getUrlParams();
  if (roomName) {
    $roomName.val(roomName);
  }

  // If any previously saved user name exists, pre-populate the user name field.
  const identity = localStorage.getItem('userName');
  if (identity) {
    $identity.val(identity);
  }

  if (error) {
    $alert.text(getUserFriendlyError(error));
    $alert.css('display', '');
  } else {
    $alert.css('display', 'none');
  }

  return new Promise(resolve => {
    $modal.on('shown.bs.modal', function onShow() {
      $modal.off('shown.bs.modal', onShow);
      $changeMedia.click(function onChangeMedia() {
        $changeMedia.off('click', onChangeMedia);
        $modal.modal('hide');
        resolve(null);
      });

      $join.click(function onJoin() {
        const identity = $identity.val();
        const roomName = $roomName.val();
        if (identity && roomName) {
          // Append the Room name to the web application URL.
          addUrlParams({ roomName });

          // Save the user name.
          localStorage.setItem('userName', identity);

          $join.off('click', onJoin);
          $modal.modal('hide');
        }
      });
    });

    $modal.on('hidden.bs.modal', function onHide() {
      $modal.off('hidden.bs.modal', onHide);
      const identity = $identity.val();
      const roomName = $roomName.val();
      resolve({ identity, roomName });
    });

    $modal.modal({
      backdrop: 'static',
      focus: true,
      keyboard: false,
      show: true
    });
  });
}

module.exports = selectRoom;
