'use strict';

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = AudioContext ? new AudioContext() : null;

function rootMeanSquare(samples) {
  const sumSq = samples.reduce((sumSq, sample) => sumSq + sample * sample, 0);
  return Math.sqrt(sumSq / samples.length);
}

module.exports = audioContext ? function micLevel(stream, maxLevel, onLevel) {
  audioContext.resume().then(() => {
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.5;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    const samples = new Uint8Array(analyser.frequencyBinCount);

    let level = null;

    requestAnimationFrame(function checkLevel() {
      analyser.getByteFrequencyData(samples);
      const rms = rootMeanSquare(samples);
      const log2Rms = rms && Math.log2(rms);
      const newLevel = Math.round(maxLevel * log2Rms / 8);

      if (level !== newLevel) {
        level = newLevel;
        onLevel(level);
      }
      requestAnimationFrame(checkLevel);
    });
  });
} : function notSupported() {
  // Do nothing.
};
