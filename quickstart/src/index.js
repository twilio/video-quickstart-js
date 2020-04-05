'use strict';

const selectMic = require('./selectmic');

const $modals = $('#modals');
const $selectMicModal = $('#select-mic', $modals);

const tracks = window.tracks = [];

window.addEventListener('load', () => {
  selectMic($selectMicModal).then(track => {
    tracks.push(track);
  });
});
