'use strict';

/**
 * Select your Room name and identity (screen name).
 * @param $modal - modal for selecting your Room name and identity.
 */
function selectRoom($modal) {
  const $changeMedia = $('button.btn-dark', $modal);
  const $identity = $('#screen-name', $modal);
  const $join = $('button.btn-primary', $modal);
  const $roomName = $('#room-name', $modal);

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
          $join.off('click', onJoin);
          $modal.modal('hide');
          resolve({ identity: $identity.val(), roomName: $roomName.val() });
        }
      });
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
