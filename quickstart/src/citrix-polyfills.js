/**
 * Polyfills the CitrixPeerConnection event listeners.
 * By default, CitrixPeerConnection handle events through the `on<event>` method.
 * This polyfill allows for the use of the `addEventListener` and `removeEventListener` methods.
 */
function polyfillPeerConnectionEventListeners() {
  const instanceListeners = new WeakMap();

  window.CitrixWebRTC.CitrixPeerConnection.prototype.addEventListener = function(eventName, listener) {
    const methodName = `on${eventName}`;
    if(!(methodName in this)) {
      throw new Error(`Unrecognized event: ${eventName}. CitrixPeerConnection does not support this event.`);
    }

    // Get or initialize listeners for this instance
    let listeners = instanceListeners.get(this);
    if (!listeners) {
      listeners = {};
      instanceListeners.set(this, listeners);
    }

    // Get or initialize listeners for this event
    const currentListeners = listeners[eventName] || [];
    listeners[eventName] = currentListeners.concat(listener);
    
    this[methodName] = createEventHandler(listeners[eventName]);
  }

  window.CitrixWebRTC.CitrixPeerConnection.prototype.removeEventListener = function(eventName, listener) {
    const methodName = `on${eventName}`;
    const listeners = instanceListeners.get(this);
    if (!listeners) return;

    const currentListeners = listeners[eventName] || [];
    listeners[eventName] = currentListeners.filter(l => l !== listener);
    
    this[methodName] = createEventHandler(listeners[eventName]);
  }
}

/**
 * Polyfills the CitrixDataChannel event listeners.
 * By default, CitrixDataChannel handles events through the `on<event>` method.
 * This polyfill allows for the use of the `addEventListener` and `removeEventListener` methods.
 */
function polyfillDataChannelEventListeners() {
  const originalCreateDataChannel = window.CitrixWebRTC.CitrixPeerConnection.prototype.createDataChannel;

  window.CitrixWebRTC.CitrixPeerConnection.prototype.createDataChannel = function(label, options) {
    const dataChannel = originalCreateDataChannel.call(this, label, options);
    const listeners = {};

    dataChannel.addEventListener = function(eventName, listener) {
      const methodName = `on${eventName}`;
      if(!(methodName in this)) {
        throw new Error(`Unrecognized event: ${eventName}. CitrixDataChannel does not support this event.`);
      }

      // Get or initialize listeners for this event
      const currentListeners = listeners[eventName] || [];
      listeners[eventName] = currentListeners.concat(listener);
      
      this[methodName] = createEventHandler(listeners[eventName]);
    }

    dataChannel.removeEventListener = function(eventName, listener) {
      const methodName = `on${eventName}`;
      const currentListeners = listeners[eventName] || [];
      listeners[eventName] = currentListeners.filter(l => l !== listener);
      
      this[methodName] = createEventHandler(listeners[eventName]);
    }

    return dataChannel;
  }
}

/** 
 * Polyfills the MediaStream event listeners.
 * By default, MediaStream handles events through the `on<event>` method.
 * This polyfill allows for the use of the `addEventListener` and `removeEventListener` methods.
 */
function polyfillMediaStreamEventListeners() {
  const originalCreateMediaStream = window.CitrixWebRTC.createMediaStream;

  window.CitrixWebRTC.createMediaStream = function(tracks) {
    const mediaStream = originalCreateMediaStream.call(this, tracks);
    const listeners = {};

    mediaStream.addEventListener = function(eventName, listener) {
      const methodName = `on${eventName}`;
      if(!(methodName in this)) {
        throw new Error(`Unrecognized event: ${eventName}. MediaStream does not support this event.`);
      }

      // Get or initialize listeners for this event
      const currentListeners = listeners[eventName] || [];
      listeners[eventName] = currentListeners.concat(listener);
      
      this[methodName] = createEventHandler(listeners[eventName]);
    }

    mediaStream.removeEventListener = function(eventName, listener) {
      const methodName = `on${eventName}`;
      const currentListeners = listeners[eventName] || [];
      listeners[eventName] = currentListeners.filter(l => l !== listener);
      
      this[methodName] = createEventHandler(listeners[eventName]);
    }

    return mediaStream;
  }
}

/**
 * Creates an event handler function that calls all registered listeners with the event
 * @param {Function[]} listeners - Array of event listener functions to call
 * @returns {Function} Event handler function that calls all listeners
 */
function createEventHandler(listeners) {
  return function runAll(event) {
    listeners.forEach(listener => listener(event));
  }
}

function installCitrixWebRTCPolyfills() {
  // PeerConnection Polyfills
  polyfillPeerConnectionEventListeners();
  polyfillDataChannelEventListeners();
  // MediaStream Polyfills
  polyfillMediaStreamEventListeners();
}


module.exports.installCitrixWebRTCPolyfills = installCitrixWebRTCPolyfills;
