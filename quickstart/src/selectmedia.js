'use strict';

const { createLocalTracks } = require('twilio-video');
const { getDeviceSelectionOptions } = require('../../examples/mediadevices/src/helpers');

let localTrack = null;

function applySelectedDevice(kind, deviceId, render) {
  createLocalTracks({ [kind]: { deviceId } }).then(([track]) => {
    if (localTrack) {
      localTrack.stop();
    }
    localTrack = track;
    const stream = new MediaStream([track.mediaStreamTrack]);
    render(stream);
  });
}

function selectMedia(kind, $modal, render) {
  return getDeviceSelectionOptions().then(({ [`${kind}input`]: devices }) => {
    const $apply = $('button', $modal);
    const $inputDevices = $('select', $modal);

    $inputDevices.html(devices.map(({ deviceId, label }) => {
      return `<option value="${deviceId}">${label}</option>`;
    }));

    const setDevice = () => applySelectedDevice(kind, $inputDevices.val(), render);

    return new Promise(resolve => {
      $modal.on('shown.bs.modal', function onShow() {
        $modal.off('shown.bs.modal', onShow);
        setDevice();
        $inputDevices.change(setDevice);

        $apply.click(function onApply() {
          $inputDevices.off('change', setDevice);
          $apply.off('click', onApply);
          $modal.modal('hide');
          resolve(localTrack);
        });
      });

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
