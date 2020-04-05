'use strict';

const { createLocalAudioTrack } = require('twilio-video');
const { getDeviceSelectionOptions } = require('../../examples/mediadevices/src/helpers');
const micLevel = require('./miclevel');

let audioTrack = null;

function applySelectedMic(deviceId, $levelIndicator) {
  createLocalAudioTrack({ deviceId }).then(track => {
    if (audioTrack) {
      audioTrack.stop();
    }
    audioTrack = track;
    const stream = new MediaStream([track.mediaStreamTrack]);
    const maxLevel = Number($levelIndicator.attr('y'));
    micLevel(stream, maxLevel, level => $levelIndicator.attr('y', maxLevel - level));
  });
}

function selectMic($modal) {
  return getDeviceSelectionOptions().then(({ audioinput }) => {
    const $apply = $('button', $modal);
    const $inputDevices = $('#audio-input-devices', $modal);
    const $levelIndicator = $('svg rect', $modal);

    $inputDevices.html(audioinput.map(deviceInfo => {
      return `<option value="${deviceInfo.deviceId}">${deviceInfo.label}</option>`;
    }));

    const changeMic = () => applySelectedMic($inputDevices.val(), $levelIndicator);

    return new Promise(resolve => {
      $modal.on('shown.bs.modal', function onShow() {
        $modal.off('shown.bs.modal', onShow);
        changeMic();
        $inputDevices.change(changeMic);

        $apply.click(function onApply() {
          $inputDevices.off('change', changeMic);
          $apply.off('click', onApply);
          $modal.modal('hide');
          resolve(audioTrack);
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

module.exports = selectMic;
