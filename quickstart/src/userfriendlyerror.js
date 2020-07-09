'use strict';

const USER_FRIENDLY_ERRORS = {
  NotAllowedError: () => {
    return '<b>Cause: </b><br>The user did not give permission to access to your input device by clicking the "deny" button on the permission dialog, or dismissing the permission dialog, or by going to the browser settings.<br>'
    +'<br><b>Solution: </b><br> Please allow the app to access the input device on the browser settings and reload the app.';
  },
  NotFoundError: () => {
    return '<b>Cause: </b><br>The user has disabled the input device for the browser in the system settings or the user\'s machine does not have such input device connected to it.<br>'
    +'<br><b>Solution</b><br>The user should enable the input device for the browser in the system settings, or have atleast one input device connected.';
  },
  NotReadableError: () => {
    return '<b>Cause: </b><br>The browser could not start media capture with the input device.<br>'
    +'<br><b>Solution: </b><br>Please close other apps and windows that have reserved the input device and reload the app or restart the browser.';
  },
  OverconstrainedError: error => {
    return error.constraint === 'deviceId'
      ? '<b>Cause: </b>Your saved microphone or camera is no longer available.<br><br><b>Solution: </b><br>Please make sure the input device is connected to the machine.'
      : 'Could not satisfy the requested media constraints. One of the reasons '
        + 'could be that your saved microphone or camera is no longer available.';
  },
  TypeError: () => {
    return '<b>Cause: </b><br><code>navigator.mediaDevices</code> does not exist.<br>'
     + '<br><b>Solution: </b><br>If you\'re sure that your browser supports it, make sure your app is being served from a secure context, '
     + 'either <code>localhost</code> or an <code>https</code> domain.';
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
