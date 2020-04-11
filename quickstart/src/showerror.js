'use strict';

const userFriendlyErrors = {
  NotAllowedError: 'The user did not give permission to access your media.',
  NotFoundError: 'No media of the type specified were found that satisfy the '
    + 'given constraints.',
  NotReadableError: 'Could not access your media due to a hardware error.',
  TypeError: '<code>navigator.mediaDevices</code> does not exist. If you\'re'
    + ' sure that your browser supports it, make sure your app is being served'
    + 'either from <code>localhost</code> or an <code>https</code> domain.'
};

/**
 * Show the given error.
 * @param $modal - modal for showing the error.
 * @param error - Error to be shown.
 */
function showError($modal, error) {
  // Add the appropriate error message to the alert.
  $('div.alert', $modal).html(userFriendlyErrors[error.name]
    || 'Unknown error.');

  $modal.modal({
    backdrop: 'static',
    focus: true,
    keyboard: false,
    show: true
  });
}

module.exports = showError;
