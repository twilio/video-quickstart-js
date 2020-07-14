'use strict';

const USER_FRIENDLY_ERRORS = {
  NotAllowedError: () => {
    return '<b>Causes: </b><br>1. The user has denied permission for your app to access the input device either by dismissing the permission dialog or clicking on the "deny" button.<br> 2. The user has denied permission for your app to access the input device in the browser settings.<br>'
    +'<br><b>Solutions: </b><br> 1. The user should reload your app and grant permission to access the input device.<br> 2. The user should allow access to the input device in the browser settings and then reload your app.';
  },
  NotFoundError: () => {
    return '<b>Cause: </b><br>1. The user has disabled the input device for the browser in the system settings.<br>2. The user\'s machine does not have such input device connected to it.<br>'
    +'<br><b>Solution</b><br>1. The user should enable the input device for the browser in the system settings<br>2. The user should have atleast one input device connected.';
  },
  NotReadableError: () => {
    return '<b>Cause: </b><br>The browser could not start media capture with the input device even after the user gave permission, probably because another app or tab has reserved the input device.<br>'
    +'<br><b>Solution: </b><br>The user should close all other apps and tabs that have reserved the input device and reload your app, or worst case, restart the browser.';
  },
  OverconstrainedError: error => {
    return error.constraint === 'deviceId'
      ? '<b>Cause: </b><br>Your saved microphone or camera is no longer available.<br><br><b>Solution: </b><br>Please make sure the input device is connected to the machine.'
      : '<b>Cause: </b><br>Could not satisfy the requested media constraints. One of the reasons '
        + 'could be that your saved microphone or camera is no longer available.<br><br><b>Solution: </b><br>Please make sure the input device is connected to the machine.';
  },
  TypeError: () => {
    return '<b>Cause: </b><br><code>navigator.mediaDevices</code> does not exist.<br>'
    + '<br><b>Solution: </b><br>If you\'re sure that the browser supports '
    + '<code>navigator.mediaDevices</code>, make sure your app is being served '
    + 'from a secure context (<code>localhost</code> or an <code>https</code> domain).';
  }
};

/**
 * Get a user friendly Error message.
 * @param error - the Error for which a user friendly message is needed
 * @returns {string} the user friendly message
 */
function getUserFriendlyError(error) {
  const errorName = [error.name, error.constructor.name].find(errorName => {
    return errorName in USER_FRIENDLY_ERRORS;
  });
  return errorName ? USER_FRIENDLY_ERRORS[errorName](error) : error.message;
}

module.exports = getUserFriendlyError;
