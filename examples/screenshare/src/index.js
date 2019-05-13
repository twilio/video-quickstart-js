'use strict';

const Prism = require('prismjs');
const getSnippet = require('../../util/getsnippet');
const helpers = require('./helpers');
const createScreenTrack = helpers.createScreenTrack;
const captureScreen = document.querySelector('button#capturescreen');
const screenPreview = document.querySelector('video#screenpreview');
const stopScreenCapture = document.querySelector('button#stopscreencapture');

(async function() {
  // Load the code snippet.
  const snippet = await getSnippet('./helpers.js');
  const pre = document.querySelector('pre.language-javascript');
  pre.innerHTML = Prism.highlight(snippet, Prism.languages.javascript);

  // Hide the "Stop Capture Screen" button.
  stopScreenCapture.style.display = 'none';

  // The LocalVideoTrack for your screen.
  let screenTrack;

  captureScreen.onclick = async function() {
    try {
      // Create and preview your local screen.
      screenTrack = await createScreenTrack(720, 1280);
      screenTrack.attach(screenPreview);
      // Show the "Capture Screen" button after screen capture stops.
      screenTrack.on('stopped', toggleButtons);
      // Show the "Stop Capture Screen" button.
      toggleButtons();
    } catch (e) {
      alert(e.message);
    }
  };

  stopScreenCapture.onclick = function() {
    // Stop capturing your screen.
    screenTrack.stop();
  }
}());

function toggleButtons() {
  captureScreen.style.display = captureScreen.style.display === 'none' ? '' : 'none';
  stopScreenCapture.style.display = stopScreenCapture.style.display === 'none' ? '' : 'none';
}
