'use strict';

const micLevel = require('./miclevel');
const selectMedia = require('./selectmedia');

const $modals = $('#modals');
const $selectMicModal = $('#select-mic', $modals);
const $selectCameraModal = $('#select-camera', $modals);

const tracks = window.tracks = [];

window.addEventListener('load', () => {
  selectMedia('audio', $selectMicModal, stream => {
    const $levelIndicator = $('svg rect', $selectMicModal);
    const maxLevel = Number($levelIndicator.attr('y'));
    micLevel(stream, maxLevel, level => $levelIndicator.attr('y', maxLevel - level));
  }).then(track => {
    tracks.push(track);
    return selectMedia('video', $selectCameraModal, stream => {
      const $video = $('video', $selectCameraModal);
      $video.get(0).srcObject = stream;
    });
  }).then(track => {
    tracks.push(track);
  });
});
