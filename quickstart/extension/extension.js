chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  switch (message && message.type) {
    // Our web app sent us a "getUserScreen" request.
    case 'getUserScreen':
      handleGetUserScreenRequest(message.sources, sender.tab, sendResponse);
      break;

    // Our web app sent us a request we don't recognize.
    default:
      handleUnrecognizedRequest(sendResponse);
      break;
  }

  return true;
});

/**
 * Respond to a "getUserScreen" request.
 * @param {Array<DesktopCaptureSourceType>} sources
 * @param {Tab} tab
 * @param {function} sendResponse
 * @returns {void}
 */
function handleGetUserScreenRequest(sources, tab, sendResponse) {
  chrome.desktopCapture.chooseDesktopMedia(sources, tab, streamId => {
    // The user canceled our request.
    if (!streamId) {
      sendResponse({
        type: 'error',
        message: 'Failed to get stream ID'
      });
    }

    // The user accepted our request.
    sendResponse({
      type: 'success',
      streamId: streamId
    });
  });
}

/**
 * Respond to an unrecognized request.
 * @param {function} sendResponse
 * @returns {void}
 */
function handleUnrecognizedRequest(sendResponse) {
  sendResponse({
    type: 'error',
    message: 'Unrecognized request'
  });
}