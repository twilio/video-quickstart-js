'use strict';

/**
 * Add URL parameters to the web app URL.
 * @param params - the parameters to add
 */
function addUrlParams(params) {
  const combinedParams = Object.assign(getUrlParams(), params);
  const serializedParams = Object.entries(combinedParams)
    .map(([name, value]) => `${name}=${encodeURIComponent(value)}`)
    .join('&');
  history.pushState(null, '', `${location.pathname}?${serializedParams}`);
}

/**
 * Generate an object map of URL parameters.
 * @returns {*}
 */
function getUrlParams() {
  const serializedParams = location.search.split('?')[1];
  const nvpairs = serializedParams ? serializedParams.split('&') : [];
  return nvpairs.reduce((params, nvpair) => {
    const [name, value] = nvpair.split('=');
    params[name] = decodeURIComponent(value);
    return params;
  }, {});
}

/**
 * Whether the web app is running on a mobile browser.
 * @type {boolean}
 */
const isMobile = (() => {
  if (typeof navigator === 'undefined' || typeof navigator.userAgent !== 'string') {
    return false;
  }
  return /Mobile/.test(navigator.userAgent);
})();

module.exports = {
  addUrlParams,
  getUrlParams,
  isMobile
};
