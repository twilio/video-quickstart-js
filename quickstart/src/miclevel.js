'use strict';

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = AudioContext ? new AudioContext() : null;

/**
 * Calculate the root mean square (RMS) of the given array.
 * @param samples
 * @returns {number} the RMS value
 */
function rootMeanSquare(samples) {
  const sumSq = samples.reduce((sumSq, sample) => sumSq + sample * sample, 0);
  return Math.sqrt(sumSq / samples.length);
}

/**
 * Poll the microphone's input level.
 * @param audioTrack - the AudioTrack representing the microphone
 * @param maxLevel - the calculated level should be in the range [0 - maxLevel]
 * @param onLevel - called when the input level changes
 */
module.exports = audioContext ? function micLevel(audioTrack, maxLevel, onLevel) {
  audioContext.resume().then(() => {
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.5;


    const initializeAnalyser = () => {
      const stream = new MediaStream([audioTrack.mediaStreamTrack]);
      const audioSource = audioContext.createMediaStreamSource(stream);
      audioSource.connect(analyser);
    }

    audioTrack.on('started', initializeAnalyser);

    const samples = new Uint8Array(analyser.frequencyBinCount);

    let level = null;

    requestAnimationFrame(function checkLevel() {
      analyser.getByteFrequencyData(samples);
      const rms = rootMeanSquare(samples);
      const log2Rms = rms && Math.log2(rms);
      const newLevel = Math.ceil(maxLevel * log2Rms / 8);

      if (level !== newLevel) {
        level = newLevel;
        onLevel(level);
      }

      requestAnimationFrame(audioTrack.readyState === 'ended'
      ? () => onLevel(0)
      : checkLevel);
    });
  });
} : function notSupported() {
  // Do nothing.
};
