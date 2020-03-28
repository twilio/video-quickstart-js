'use strict';

var StackBlur = require('stackblur-canvas');

/**
 * Apply a Gaussian Blur filter to the ImageData.
 * @param {ImageData} imageData
 * @returns {ImageData}
 */
function blur(imageData) {
  var w = imageData.width;
  var h = imageData.height;
  var r = 10;
  StackBlur.imageDataRGBA(imageData, 0, 0, w, h, r);
  return imageData;
}

/**
 * Apply a Grayscale filter to the ImageData.
 * @param {ImageData} imageData
 * @returns {ImageData}
 */
function grayscale(imageData) {
  var data = imageData.data;
  for (var i = 0; i < data.length; i += 4) {
    var r = data[i];
    var g = data[i + 1];
    var b = data[i + 2];
    var gs = ((0.2126 * r) + (0.7152 * g) + (0.0722 * b)) / 3;
    data[i] = data[i + 1] = data[i + 2] = gs;
  }
  return imageData;
}

/**
 * Return the ImageData without applying any filter.
 * @param {ImageData} imageData
 * @returns {ImageData}
 */
function none(imageData) {
  return imageData;
}

/**
 * Apply a Sepia filter to the ImageData.
 * @param {ImageData} imageData
 * @returns {ImageData}
 */
function sepia(imageData) {
  var data = imageData.data;
  for (var i = 0; i < data.length; i += 4) {
    var r = data[i];
    var g = data[i + 1];
    var b = data[i + 2];
    data[i] = (r * 0.393) + (g * 0.769) + (b * 0.189);
    data[i + 1] = (r * 0.349) + (g * 0.686) + (b * 0.168);
    data[i + 2] = (r * 0.272) + (g * 0.534) + (b * 0.131);
  }
  return imageData;
}

module.exports.blur = blur;
module.exports.grayscale = grayscale;
module.exports.none = none;
module.exports.sepia = sepia;
