'use strict';

const { createLocalTracks } = require('twilio-video');
const { getDeviceSelectionOptions } = require('../../examples/mediadevices/src/helpers');

const localTracks = {
  audio: null,
  video: null
};

/**
 * Start capturing media from the selected input device.
 * @param kind - 'audio' or 'video'
 * @param deviceId - the input device ID
 * @param render - the render callback
 */
function applySelectedDevice(kind, deviceId, render) {
  // Create a new LocalTrack from the given Device ID.
  createLocalTracks({ [kind]: { deviceId } }).then(([track]) => {
    // Stop the previous LocalTrack, if present.
    if (localTracks[kind]) {
      localTracks[kind].stop();
    }

    // Render the current LocalTrack.
    localTracks[kind] = track;
    const stream = new MediaStream([track.mediaStreamTrack]);
    render(stream);
  });
}

/**
 * Select the input for the given media kind.
 * @param kind - 'audio' or 'video'
 * @param $modal - the modal for selecting the media input
 * @param render - the media render function
 * @returns {Promise<string>} the device ID of the selected media input
 */
function selectMedia(kind, $modal, render) {
  // Get the list of available media input devices.
  return getDeviceSelectionOptions().then(({ [`${kind}input`]: devices }) => {
    const $apply = $('button', $modal);
    const $inputDevices = $('select', $modal);

    // Populate the modal with the list of available media input devices.
    $inputDevices.html(devices.map(({ deviceId, label }) => {
      return `<option value="${deviceId}">${label}</option>`;
    }));

    // Apply the selected media input device.
    const setDevice = () => applySelectedDevice(
      kind,
      $inputDevices.val(),
      render);

    return new Promise(resolve => {
      $modal.on('shown.bs.modal', function onShow() {
        $modal.off('shown.bs.modal', onShow);

        // Apply the default media input device.
        setDevice();

        // When the user selects a different media input device,
        // apply it.
        $inputDevices.change(setDevice);

        // When the user clicks the "Apply" button, save the device ID
        // and close the modal.
        $apply.click(function onApply() {
          $inputDevices.off('change', setDevice);
          $apply.off('click', onApply);
          $modal.modal('hide');

          // Stop the LocalTrack, if present.
          if (localTracks[kind]) {
            localTracks[kind].stop();
            localTracks[kind] = null;
          }

          // Resolve the Promise with the selected device ID.
          resolve($inputDevices.val());
        });
      });

      // Show the modal.
      $modal.modal({
        backdrop: 'static',
        focus: true,
        keyboard: false,
        show: true
      });
    });
  });
}

module.exports = selectMedia;
