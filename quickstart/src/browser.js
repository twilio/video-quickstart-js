'use strict';

const name = (() => {
  if (typeof navigator === 'undefined' || typeof navigator.userAgent !== 'string') {
    return null;
  }
  if (/Chrome|CriOS/.test(navigator.userAgent)) {
    return 'chrome';
  }
  if (/Firefox|FxiOS/.test(navigator.userAgent)) {
    return 'firefox';
  }
  if (/Safari/.test(navigator.userAgent)) {
    return 'safari';
  }
  return null;
})();

const isMobile = (() => {
  if (typeof navigator === 'undefined' || typeof navigator.userAgent !== 'string') {
    return false;
  }
  return /Mobile/.test(navigator.userAgent);
})();

module.exports = {
  isMobile,
  name
};
