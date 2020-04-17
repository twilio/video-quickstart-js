'use strict';

const USER_FRIENDLY_ERRORS = {
  NotAllowedError: () => {
    return 'The user did not give permission to access your media.';
  },
  NotFoundError: () => {
    return 'None of the available media types satisfied the given constraints.';
  },
  NotReadableError: () => {
    return 'Could not access your media due to a hardware error.';
  },
  OverconstrainedError: error => {
    return error.constraint === 'deviceId'
      ? 'Your saved microphone or camera is no longer available.'
      : 'Could not satisfy the requested media constraints. One of the reasons '
        + 'could be that your saved microphone or camera is no longer available.';
  },
  TypeError: () => {
    return '<code>navigator.mediaDevices</code> does not exist. If you\'re'
     + ' sure that your browser supports it, make sure your app is being served'
     + 'either from <code>localhost</code> or an <code>https</code> domain.';
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
