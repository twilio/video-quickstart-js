/**
 * Create a MediaStream object using Citrix WebRTC
 * @param {Array<MediaStreamTrack>} stremtracks - An array of MediaStreamTracks to include in the MediaStream
 * @returns {MediaStream} The created Citrix MediaStream object
 */
function MediaStream(streamTracks = []) {
  return window.CitrixWebRTC.createMediaStream(streamTracks);
}

/**
 * Attach a media track to a DOM element using Citrix WebRTC
 * @param {Object} track - The media track to attach
 * @param {HTMLElement} element - The DOM element to attach the track to
 */
function mapMediaElement(el) {
  const tagName = el.tagName.toLowerCase();
  const handlePlay = () => el.dispatchEvent(new Event('canplay'));

  if (tagName === 'video') {
    el.addEventListener('loadedmetadata', handlePlay);
    window.CitrixWebRTC.mapVideoElement(el);
  } else if (tagName === 'audio') {
    // The 'loadedmetadata' event is not fired for audio elements, so we simulate it
    setTimeout(handlePlay, 200);
    window.CitrixWebRTC.mapAudioElement(el);
  }
}

/**
 * Detach a media track from a DOM element using Citrix WebRTC
 * @param {HTMLElement} element - The DOM element to detach the track from
 */
function disposeMediaElement(el) {
  const tagName = el.tagName.toLowerCase();
  if (tagName === 'video') {
    window.CitrixWebRTC.disposeVideoElement(el);
  } else if (tagName === 'audio') {
    window.CitrixWebRTC.disposeAudioElement(el);
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

module.exports.adjustClientAreaOffset = adjustClientAreaOffset;
module.exports.CustomMediaStream = MediaStream;
module.exports.mapMediaElement = mapMediaElement;
module.exports.disposeMediaElement = disposeMediaElement;
