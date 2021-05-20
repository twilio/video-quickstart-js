'use strict'

const Prism = require('prismjs');
const Video = require('twilio-video');
const getSnippet = require('../../util/getsnippet');
const getRoomCredentials = require('../../util/getroomcredentials');
const helpers = require('./helpers');
const switchOnOffBtn = document.querySelector('button#switchOnOff');
const videoEl = document.querySelector('video#remotevideo');


(async function(){
  // Load the code snippet.
  const snippet = await getSnippet('./helpers.js');
  const pre = document.querySelector('pre.language-javascript');

  pre.innerHTML = Prism.highlight(snippet, Prism.languages.javascript);

  // Get the credentials to connect to the Room.
  const credsP1 = await getRoomCredentials();
  const credsP2 = await getRoomCredentials();

  const connectOptions = {
    name: 'my-cool-room',
    bandwidthProfile: {
      video: {
        contentPreferencesMode: 'manual',
        clientTrackSwitchOffControl: 'manual'
      }
    }
  }

  // Create room instance and name for participants to join.
  const roomP1 = await Video.connect(credsP1.token, connectOptions);

  // Create and attach the video track for the Remote Participant
  const remoteVideoTrack = await Video.createLocalVideoTrack();
  remoteVideoTrack.attach(videoEl);

  // Connecting remote participant.
  const roomP2 = await Video.connect(credsP2.token, {
    connectOptions,
    track: [ remoteVideoTrack ]
  });


  console.log('connected to room', roomP1, roomP2)
}());
