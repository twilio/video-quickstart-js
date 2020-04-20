'use strict';

const { createLocalTracks } = require('twilio-video');

const localTracks = {
  audio: null,
  video: null
};

/**
 * Start capturing media from the given input device.
 * @param kind - 'audio' or 'video'
 * @param deviceId - the input device ID
 * @param render - the render callback
 * @returns {Promise<void>} Promise that is resolved if successful
 */
async function applyInputDevice(kind, deviceId, render) {
  // Create a new LocalTrack from the given Device ID.
  const [track] = await createLocalTracks({ [kind]: { deviceId } });

  // Stop the previous LocalTrack, if present.
  if (localTracks[kind]) {
    localTracks[kind].stop();
  }

  // Render the current LocalTrack.
  localTracks[kind] = track;
  render(new MediaStream([track.mediaStreamTrack]));
}

/**
 * Get the list of input devices of a given kind.
 * @param kind - 'audio' | 'video'
 * @returns {Promise<MediaDeviceInfo[]>} the list of media devices
 */
async function getInputDevices(kind) {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter(device => device.kind === `${kind}input`);
}

/**
 * Select the input for the given media kind.
 * @param kind - 'audio' or 'video'
 * @param $modal - the modal for selecting the media input
 * @param render - the media render function
 * @returns {Promise<string>} the device ID of the selected media input
 */
async function selectMedia(kind, $modal, render) {
  const $apply = $('button', $modal);
  const $inputDevices = $('select', $modal);
  const setDevice = () => applyInputDevice(kind, $inputDevices.val(), render);

  // Get the list of available media input devices.
  let devices =  await getInputDevices(kind);

  // Apply the default media input device.
  await applyInputDevice(kind, devices[0].deviceId, render);

  // If all device IDs and/or labels are empty, that means they were
  // enumerated before the user granted media permissions. So, enumerate
  // the devices again.
  if (devices.every(({ deviceId, label }) => !deviceId || !label)) {
    devices = await getInputDevices(kind);
  }

  // Populate the modal with the list of available media input devices.
  $inputDevices.html(devices.map(({ deviceId, label }) => {
    return `<option value="${deviceId}">${label}</option>`;
  }));

  return new Promise(resolve => {
    $modal.on('shown.bs.modal', function onShow() {
      $modal.off('shown.bs.modal', onShow);

      // When the user selects a different media input device, apply it.
      $inputDevices.change(setDevice);

      // When the user clicks the "Apply" button, close the modal.
      $apply.click(function onApply() {
        $inputDevices.off('change', setDevice);
        $apply.off('click', onApply);
        $modal.modal('hide');
      });
    });

    // When the modal is closed, save the device ID.
    $modal.on('hidden.bs.modal', function onHide() {
      $modal.off('hidden.bs.modal', onHide);

      // Stop the LocalTrack, if present.
      if (localTracks[kind]) {
        localTracks[kind].stop();
        localTracks[kind] = null;
      }

      // Resolve the Promise with the saved device ID.
      const deviceId = $inputDevices.val();
      localStorage.setItem(`${kind}DeviceId`, deviceId);
      resolve(deviceId);
    });

    // Show the modal.
    $modal.modal({
      backdrop: 'static',
      focus: true,
      keyboard: false,
      show: true
    });
  });
}

module.exports = selectMedia;
