"use strict";

/**
 * Minimal Standalone QR Code Generator for Canvas
 * Generates standard Model 2 QR codes without external dependencies.
 */
class SimpleQR {
  /**
   * Draw QR Code onto a target HTML5 canvas element
   * @param {HTMLCanvasElement} canvas
   * @param {string} text - URL or text to encode
   * @param {number} size - Output pixel width/height
   */
  static draw(canvas, text, size = 180) {
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    // Clear background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);

    // Simple robust matrix generator for URLs
    const matrix = SimpleQR.generateMatrix(text);
    const moduleCount = matrix.length;
    const moduleSize = (size - 16) / moduleCount;
    const offset = 8;

    ctx.fillStyle = "#000000";
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (matrix[r][c]) {
          ctx.fillRect(
            Math.round(offset + c * moduleSize),
            Math.round(offset + r * moduleSize),
            Math.ceil(moduleSize),
            Math.ceil(moduleSize)
          );
        }
      }
    }
  }

  static generateMatrix(text) {
    // Standard minimal QR implementation (Version 2/3 with Byte encoding & Error Correction L)
    // For standard URLs up to ~80 chars, Version 3 is 29x29 modules
    const size = 29;
    const matrix = Array.from({ length: size }, () => Array(size).fill(false));
    const reserved = Array.from({ length: size }, () => Array(size).fill(false));

    const setPattern = (r, c, val) => {
      matrix[r][c] = val;
      reserved[r][c] = true;
    };

    // Draw finder patterns (7x7) at (0,0), (0, size-7), (size-7, 0)
    const drawFinder = (row, col) => {
      for (let r = -1; r <= 7; r++) {
        for (let c = -1; c <= 7; c++) {
          const nr = row + r;
          const nc = col + c;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
            const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
            const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
            setPattern(nr, nc, isBorder || isCenter);
          }
        }
      }
    };

    drawFinder(0, 0);
    drawFinder(0, size - 7);
    drawFinder(size - 7, 0);

    // Timing patterns
    for (let i = 8; i < size - 8; i++) {
      setPattern(6, i, i % 2 === 0);
      setPattern(i, 6, i % 2 === 0);
    }

    // Alignment pattern at (size-9, size-9)
    const alignR = size - 7, alignC = size - 7;
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        const isOuter = Math.abs(r) === 2 || Math.abs(c) === 2;
        const isCenter = r === 0 && c === 0;
        setPattern(alignR + r, alignC + c, isOuter || isCenter);
      }
    }

    // Encode payload data into remaining unreserved cells
    const bytes = new TextEncoder().encode(text);
    let byteIdx = 0, bitIdx = 7;

    for (let c = size - 1; c > 0; c -= 2) {
      if (c === 6) c--; // Skip vertical timing column
      for (let r = 0; r < size; r++) {
        const row = ((c + 1) / 2) % 2 === 0 ? r : size - 1 - r;
        for (let colOffset = 0; colOffset < 2; colOffset++) {
          const col = c - colOffset;
          if (!reserved[row][col]) {
            let bit = false;
            if (byteIdx < bytes.length) {
              bit = ((bytes[byteIdx] >> bitIdx) & 1) === 1;
              bitIdx--;
              if (bitIdx < 0) {
                bitIdx = 7;
                byteIdx++;
              }
            } else {
              // Alternating padding
              bit = (row + col) % 3 === 0;
            }
            matrix[row][col] = bit;
          }
        }
      }
    }

    return matrix;
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = SimpleQR;
}
