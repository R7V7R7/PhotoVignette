"use strict";

/**
 * FrameRenderer
 * Manages loading and drawing the decorative camera frame onto HTML5 Canvas.
 * Supports dynamic scaling, responsive resolution, and sharp high-DPI rendering.
 */
class FrameRenderer {
  constructor(options = {}) {
    this.borderPatternSrc = options.borderPatternSrc || "assets/border-pattern.svg";
    this.cornerSrcs = {
      tl: options.cornerTlSrc || "assets/corner-tl.svg",
      tr: options.cornerTrSrc || "assets/corner-tr.svg",
      bl: options.cornerBlSrc || "assets/corner-bl.svg",
      br: options.cornerBrSrc || "assets/corner-br.svg",
    };
    this.centerBottomSrc = options.centerBottomSrc || "assets/center-bottom.svg";

    this.images = {
      border: null,
      cornerTL: null,
      cornerTR: null,
      cornerBL: null,
      cornerBR: null,
      centerBottom: null,
    };

    this.isLoaded = false;
    this.borderHeight = options.borderHeight || 30; // base thickness of border
    this.cornerBaseSize = options.cornerBaseSize || 100; // base corner size
    this.centerBaseWidth = options.centerBaseWidth || 280; // base center bottom width
    this.centerBaseHeight = options.centerBaseHeight || 70; // base center bottom height
  }

  /**
   * Preload all frame SVG assets into memory
   */
  async loadAssets() {
    const loadImage = (src) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(new Error(`Failed to load asset: ${src}`));
        img.src = src;
      });
    };

    try {
      const [border, tl, tr, bl, br, center] = await Promise.all([
        loadImage(this.borderPatternSrc),
        loadImage(this.cornerSrcs.tl),
        loadImage(this.cornerSrcs.tr),
        loadImage(this.cornerSrcs.bl),
        loadImage(this.cornerSrcs.br),
        loadImage(this.centerBottomSrc),
      ]);

      this.images.border = border;
      this.images.cornerTL = tl;
      this.images.cornerTR = tr;
      this.images.cornerBL = bl;
      this.images.cornerBR = br;
      this.images.centerBottom = center;
      this.isLoaded = true;
      return true;
    } catch (error) {
      console.error("FrameRenderer: Error loading frame assets", error);
      throw error;
    }
  }

  /**
   * Draw the entire frame onto a 2D canvas context.
   * @param {CanvasRenderingContext2D} ctx - Target 2D rendering context
   * @param {number} width - Target width in pixels
   * @param {number} height - Target height in pixels
   * @param {Object} [customOptions] - Optional customizations (text, date, scale)
   */
  draw(ctx, width, height, customOptions = {}) {
    if (!this.isLoaded) return;

    // Scale calculation based on viewport/canvas dimensions
    // For mobile portrait (e.g. 1080x1920 or screen 390x844), scale relative to ~400px width
    const minDim = Math.min(width, height);
    const scale = Math.max(0.65, Math.min(minDim / 380, 2.2));

    const borderThickness = this.borderHeight * scale;
    const cornerSize = this.cornerBaseSize * scale;
    const centerWidth = this.centerBaseWidth * scale;
    const centerHeight = this.centerBaseHeight * scale;

    ctx.save();

    // 1. Draw Corners
    // Top-Left
    ctx.drawImage(this.images.cornerTL, 0, 0, cornerSize, cornerSize);
    // Top-Right
    ctx.drawImage(this.images.cornerTR, width - cornerSize, 0, cornerSize, cornerSize);
    // Bottom-Left
    ctx.drawImage(this.images.cornerBL, 0, height - cornerSize, cornerSize, cornerSize);
    // Bottom-Right
    ctx.drawImage(this.images.cornerBR, width - cornerSize, height - cornerSize, cornerSize, cornerSize);

    // 2. Draw Repeating Borders
    const borderPatternWidth = (this.images.border.width || 60) * (borderThickness / 30);

    // TOP BORDER: from cornerSize to (width - cornerSize)
    const topStart = cornerSize;
    const topEnd = width - cornerSize;
    if (topEnd > topStart) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(topStart, 0, topEnd - topStart, borderThickness);
      ctx.clip();
      for (let x = topStart; x < topEnd; x += borderPatternWidth) {
        ctx.drawImage(this.images.border, x, 0, borderPatternWidth, borderThickness);
      }
      ctx.restore();
    }

    // BOTTOM BORDER: Left section & Right section (separated by center-bottom emblem)
    const bottomY = height - borderThickness;
    const centerLeftX = (width - centerWidth) / 2;
    const centerRightX = centerLeftX + centerWidth;

    // Bottom-Left segment
    const blEnd = Math.max(cornerSize, centerLeftX + 5 * scale);
    if (blEnd > cornerSize) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(cornerSize, bottomY, blEnd - cornerSize, borderThickness);
      ctx.clip();
      for (let x = cornerSize; x < blEnd; x += borderPatternWidth) {
        ctx.drawImage(this.images.border, x, bottomY, borderPatternWidth, borderThickness);
      }
      ctx.restore();
    }

    // Bottom-Right segment
    const brStart = Math.min(width - cornerSize, centerRightX - 5 * scale);
    const brEnd = width - cornerSize;
    if (brEnd > brStart) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(brStart, bottomY, brEnd - brStart, borderThickness);
      ctx.clip();
      for (let x = brStart; x < brEnd; x += borderPatternWidth) {
        ctx.drawImage(this.images.border, x, bottomY, borderPatternWidth, borderThickness);
      }
      ctx.restore();
    }

    // LEFT BORDER: from cornerSize to (height - cornerSize)
    const leftStart = cornerSize;
    const leftEnd = height - cornerSize;
    if (leftEnd > leftStart) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, leftStart, borderThickness, leftEnd - leftStart);
      ctx.clip();
      // Draw rotated pattern along the left edge
      for (let y = leftStart; y < leftEnd; y += borderPatternWidth) {
        ctx.save();
        ctx.translate(borderThickness, y);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(this.images.border, 0, 0, borderPatternWidth, borderThickness);
        ctx.restore();
      }
      ctx.restore();
    }

    // RIGHT BORDER: from cornerSize to (height - cornerSize)
    const rightStart = cornerSize;
    const rightEnd = height - cornerSize;
    if (rightEnd > rightStart) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(width - borderThickness, rightStart, borderThickness, rightEnd - rightStart);
      ctx.clip();
      // Draw rotated pattern along the right edge
      for (let y = rightStart; y < rightEnd; y += borderPatternWidth) {
        ctx.save();
        ctx.translate(width, y + borderPatternWidth);
        ctx.rotate(-Math.PI / 2);
        ctx.drawImage(this.images.border, 0, 0, borderPatternWidth, borderThickness);
        ctx.restore();
      }
      ctx.restore();
    }

    // 3. Draw Bottom Center Special Emblem
    const centerX = (width - centerWidth) / 2;
    const centerY = height - centerHeight;
    ctx.drawImage(this.images.centerBottom, centerX, centerY, centerWidth, centerHeight);

    // 4. Optional Custom Text Overlay (e.g. Names or Date)
    if (customOptions.customText) {
      ctx.save();
      ctx.font = `bold ${Math.round(11 * scale)}px 'Cinzel', 'Playfair Display', serif, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#FFDF73";
      ctx.shadowColor = "#000000";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 1;

      // Position text nicely inside the central cartouche
      const textY = centerY + centerHeight * 0.74;
      ctx.fillText(customOptions.customText.toUpperCase(), width / 2, textY);
      ctx.restore();
    }

    ctx.restore();
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = FrameRenderer;
}
