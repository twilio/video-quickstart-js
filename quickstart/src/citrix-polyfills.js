/**
 * Polyfills the CitrixPeerConnection event listeners.
 * By default, CitrixPeerConnection handle events through the `on<event>` method.
 * This polyfill allows for the use of the `addEventListener` and `removeEventListener` methods.
 */
function polyfillPeerConnectionEventListeners() {
  // Store event listeners per instance rather than globally
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
 * Polyfills the CitrixPeerConnection.addTransceiver method.
 * By default, CitrixPeerConnection.addTransceiver requires at least an empty init object to be passed as the second argument.
 * This polyfill allows for the use of the `addTransceiver` method without the init following the WebRTC spec.
 */
function polyfillAddTransceiver() {
  const originalAddTransceiver = window.CitrixWebRTC.CitrixPeerConnection.prototype.addTransceiver;
  
  window.CitrixWebRTC.CitrixPeerConnection.prototype.addTransceiver = function(trackOrKind, init = {}) {
    return originalAddTransceiver.call(this, trackOrKind, init);
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
 * Polyfills the CitrixPeerConnection.getStats method.
 * By default, CitrixPeerConnection.getStats does not support a selector argument.
 * This polyfill allows for the use of the `getStats` method with a selector argument
 * by filtering the stats to only include the relevant stats for the specified track.
 * 
 * @param {Object} selector - The selector object with the id property
 * @returns {Map} A map of stats with the stat ID as the key and the stat object as the value
 */
function polyfillGetStats() {
  const originalGetStats = window.CitrixWebRTC.CitrixPeerConnection.prototype.getStats;

  window.CitrixWebRTC.CitrixPeerConnection.prototype.getStats = async function(selector) {
    const rawStatsArray = await originalGetStats.call(this);
    
    // Convert array to a Map as per WebRTC specs
    const rawStats = new Map();
    rawStatsArray.forEach(stat => {
      rawStats.set(stat.id, stat);
    });
    
    // If no selector is provided, return all stats as a Map
    if (!selector) {
      return rawStats;
    }

    const filteredReport = new Map();
    const trackId = selector.id;
    const relevantIds = new Set();

    // First pass: Find media sources matching the track ID and identify related stats
    for (const [id, stat] of rawStats) {
      // Add media source that matches the track
      if (stat.type === 'media-source' && stat.trackIdentifier === trackId) {
        filteredReport.set(id, stat);
        relevantIds.add(id);
      }
    }
    // If no matching media source was found, return empty report
    if (relevantIds.size === 0) {
      return filteredReport;
    }

    // Second pass: Find all stats that reference the relevant IDs
    for (const [id, stat] of rawStats) {
      // Add outbound-rtp stats referencing the media source
      if (stat.type === 'outbound-rtp' && relevantIds.has(stat.mediaSourceId)) {
        filteredReport.set(id, stat);
        relevantIds.add(id);
        
        // Also add the referenced codec
        if (stat.codecId) {
          relevantIds.add(stat.codecId);
        }
        
        // Add the transport
        if (stat.transportId) {
          relevantIds.add(stat.transportId);
        }
      }
      
      // Add inbound-rtp stats referencing the media source
      else if (stat.type === 'inbound-rtp' && relevantIds.has(stat.mediaSourceId)) {
        filteredReport.set(id, stat);
        relevantIds.add(id);
        
        if (stat.codecId) {
          relevantIds.add(stat.codecId);
        }
        
        if (stat.transportId) {
          relevantIds.add(stat.transportId);
        }
      }
      
      // Add remote-inbound-rtp stats that reference our outbound-rtp
      else if (stat.type === 'remote-inbound-rtp' && relevantIds.has(stat.localId)) {
        filteredReport.set(id, stat);
        
        if (stat.codecId) {
          relevantIds.add(stat.codecId);
        }
        
        if (stat.transportId) {
          relevantIds.add(stat.transportId);
        }
      }
      
      // Add remote-outbound-rtp stats that reference our inbound-rtp
      else if (stat.type === 'remote-outbound-rtp' && relevantIds.has(stat.remoteId)) {
        filteredReport.set(id, stat);
        
        if (stat.codecId) {
          relevantIds.add(stat.codecId);
        }
        
        if (stat.transportId) {
          relevantIds.add(stat.transportId);
        }
      }
    }

    // Third pass: Add all the referenced stats like codec, transport, etc.
    for (const [id, stat] of rawStats) {
      if (relevantIds.has(id) && !filteredReport.has(id)) {
        filteredReport.set(id, stat);
      }
    }
    return filteredReport;
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
  polyfillAddTransceiver();
  polyfillDataChannelEventListeners();
  // MediaStream Polyfills
  polyfillMediaStreamEventListeners();
  // getStats Polyfills
  polyfillGetStats();
}


module.exports.installCitrixWebRTCPolyfills = installCitrixWebRTCPolyfills;
