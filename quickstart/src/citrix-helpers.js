/**
 * A wrapper class for CitrixWebRTC MediaStream that implements the standard MediaStream interface
 * @extends MediaStream Extending from MediaStream allows an instance to be set as the srcObject of a media element (e.g. video, audio)
 */
class CustomMediaStream extends MediaStream {
  constructor(stream) {
    if (!window.CitrixWebRTC) {
      throw new Error('CitrixWebRTC is not available');
    }
    super();
    this.citrixMediaStream = window.CitrixWebRTC.createMediaStream(stream);
  }

  // instance properties
  get id() { return this.citrixMediaStream.id; }
  get active() { return this.citrixMediaStream.active; }

  // instance methods
  addTrack(track) { this.citrixMediaStream.addTrack(track); }
  clone() { return new CustomMediaStream(this.citrixMediaStream.getTracks()); }
  getAudioTracks() { return this.citrixMediaStream.getAudioTracks(); }
  getTrackById(id) { return this.citrixMediaStream.getTrackById(id); }
  getTracks() { return this.citrixMediaStream.getTracks(); }
  getVideoTracks() { return this.citrixMediaStream.getVideoTracks(); }
  removeTrack(track) { this.citrixMediaStream.removeTrack(track); }

  // event listeners
  set onaddtrack(listener) { this.citrixMediaStream.onaddtrack = listener; }
  set onremovetrack(listener) { this.citrixMediaStream.onremovetrack = listener; }
  addEventListener(event, listener) {
    this.citrixMediaStream[`on${event}`] = listener;
  }
  removeEventListener(event) {
    this.citrixMediaStream[`on${event}`] = null;
  }
}

/**
 * Adjust the client area offset to account for the Citrix WebRTC redirection
 * @returns {Promise<void>}
 */
async function adjustClientAreaOffset() {
  const windowHandle = await window.getWindowHandleAsHex();
  const offset = window.outerHeight - window.innerHeight;
  window.CitrixWebRTC.setClientAreaOffset(0, offset, windowHandle);
}

/**
 * Attach a media track to a DOM element using Citrix WebRTC
 * @param {Object} track - The media track to attach
 * @param {HTMLElement} element - The DOM element to attach the track to
 */
function attachTrackToElement(track, element) {
  console.log('WAttaching track to element:', track, element);
  if (track.kind === 'video') {
    window.CitrixWebRTC.mapVideoElement(element);
  } else {
    window.CitrixWebRTC.mapAudioElement(element); 
  }
  element.srcObject = window.CitrixWebRTC.createMediaStream([track.mediaStreamTrack]);
}

/**
 * Detach a media track from a DOM element using Citrix WebRTC
 * @param {HTMLElement} element - The DOM element to detach the track from
 */
function detachTrackFromElement(element) {
  if (element.tagName.toLowerCase() === 'video') {
    window.CitrixWebRTC.disposeVideoElement(element);
  } else {
    window.CitrixWebRTC.disposeAudioElement(element);
  }
  element.srcObject = null;
}


module.exports.adjustClientAreaOffset = adjustClientAreaOffset;
module.exports.attachTrackToElement = attachTrackToElement;
module.exports.detachTrackFromElement = detachTrackFromElement;
module.exports.CustomMediaStream = CustomMediaStream;
