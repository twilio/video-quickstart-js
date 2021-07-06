'use strict';

const DataSeries = require('./timelinegraph').DataSeries;
const GraphView = require('./timelinegraph').GraphView;

/**
 * Set up the bitrate graph for audio or video media.
 * @param {string} kind - 'video' or 'audio'.
 * @param {string} containerId - The id of the graph container.
 * @param {string} canvasId - The id of the canvas.
 */
 function setupBitrateGraph(kind, containerId, canvasId) {
  const bitrateSeries = new DataSeries();
  const bitrateGraph = new GraphView(containerId, canvasId);

  bitrateGraph.graphDiv_.style.display = 'none';
  return function startBitrateGraph(room, intervalMs) {
    let bytesReceivedPrev = 0;
    let timestampPrev = Date.now();
    const interval = setInterval(async function() {
      if (!room) {
        clearInterval(interval);
        return;
      }
      const stats = await room.getStats();
      const remoteTrackStats = kind === 'audio'
        ? stats[0].remoteAudioTrackStats[0]
        : stats[0].remoteVideoTrackStats[0]
      const bytesReceived = remoteTrackStats.bytesReceived;
      const timestamp = remoteTrackStats.timestamp;
      const bitrate = Math.round((bytesReceivedPrev - bytesReceived) * 8 / (timestampPrev - timestamp));

      bitrateSeries.addPoint(timestamp, bitrate);
      bitrateGraph.setDataSeries([bitrateSeries]);
      bitrateGraph.updateEndDate();
      bytesReceivedPrev = bytesReceived;
      timestampPrev = timestamp;
    }, intervalMs);

    bitrateGraph.graphDiv_.style.display = '';
    return function stop() {
      clearInterval(interval);
      bitrateGraph.graphDiv_.style.display = 'none';
    };
  };
}

module.exports = setupBitrateGraph;
