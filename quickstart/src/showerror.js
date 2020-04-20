'use strict';

const getUserFriendlyError = require('./userfriendlyerror');

/**
 * Show the given error.
 * @param $modal - modal for showing the error.
 * @param error - Error to be shown.
 */
function showError($modal, error) {
  // Add the appropriate error message to the alert.
  $('div.alert', $modal).html(getUserFriendlyError(error));
  $modal.modal({
    backdrop: 'static',
    focus: true,
    keyboard: false,
    show: true
  });
}

module.exports = showError;
