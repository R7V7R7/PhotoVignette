"use strict";

/**
 * FrameRenderer
 * Manages loading and drawing the wedding floral frame onto HTML5 Canvas.
 * Incorporates:
 *  - Official high-res floral corner vignettes from the wedding invitation (assets/floral-*.png)
 *  - Continuous gold border repeat (assets/border-pattern.svg)
 *  - Dedicated "Nataly & Jorge" commemorative central crest (assets/center-bottom.svg)
 */
class FrameRenderer {
  constructor(options = {}) {
    this.borderPatternSrc = options.borderPatternSrc || "assets/border-pattern.svg";
    this.cornerSrcs = {
      tl: options.cornerTlSrc || "assets/floral-left.png",
      tr: options.cornerTrSrc || "assets/floral-right.png",
      bl: options.cornerBlSrc || "assets/floral-bl.png",
      br: options.cornerBrSrc || "assets/floral-br.png",
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
  }

  /**
   * Preload all frame assets into memory
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
   * @param {Object} [customOptions] - Optional customizations (text, date)
   */
  draw(ctx, width, height, customOptions = {}) {
    if (!this.isLoaded) return;

    const minDim = Math.min(width, height);
    // Base scale relative to mobile viewport ~400px width
    const scale = Math.max(0.68, Math.min(minDim / 400, 2.8));

    // Geometric alignment constants
    const inset = 18 * scale; // Distance of the outer frame line from canvas edge
    const borderThickness = 24 * (scale * 0.75); // Height of the border pattern strip
    const borderUnitWidth = 40 * (borderThickness / 24);

    // Corner bouquet size (gracefully sits anchored in the corners)
    const cornerSize = Math.min(minDim * 0.38, 170 * scale);

    // Center bottom crest dimensions
    const centerWidth = Math.min(width * 0.78, 350 * scale);
    const centerHeight = (centerWidth / 360) * 90;
    const centerX = (width - centerWidth) / 2;

    // In center-bottom.svg, the baseline outer connector line is at y = 65 out of 90.
    // Placing centerY so that centerY + (65/90)*centerHeight === height - inset
    // guarantees an exact pixel-perfect match with the bottom border line!
    const centerY = (height - inset) - (65 / 90) * centerHeight;
    const centerLeftX = centerX + (55 / 360) * centerWidth;
    const centerRightX = centerX + (305 / 360) * centerWidth;

    ctx.save();

    // ----------------------------------------------------
    // 1. Draw Border Repeating Patterns
    // ----------------------------------------------------

    // TOP BORDER
    ctx.save();
    ctx.beginPath();
    ctx.rect(inset, inset - borderThickness + (20 / 24) * borderThickness, width - 2 * inset, borderThickness);
    ctx.clip();
    for (let x = inset; x < width - inset; x += borderUnitWidth) {
      ctx.drawImage(
        this.images.border,
        x,
        inset - (20 / 24) * borderThickness,
        borderUnitWidth,
        borderThickness
      );
    }
    ctx.restore();

    // BOTTOM BORDER - Left segment (from left inset to centerLeftX)
    const bottomPatternY = (height - inset) - (20 / 24) * borderThickness;
    if (centerLeftX > inset) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(inset, bottomPatternY, centerLeftX - inset, borderThickness);
      ctx.clip();
      for (let x = inset; x < centerLeftX; x += borderUnitWidth) {
        ctx.drawImage(this.images.border, x, bottomPatternY, borderUnitWidth, borderThickness);
      }
      ctx.restore();
    }

    // BOTTOM BORDER - Right segment (from centerRightX to width - inset)
    if (width - inset > centerRightX) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(centerRightX, bottomPatternY, (width - inset) - centerRightX, borderThickness);
      ctx.clip();
      for (let x = centerRightX; x < width - inset; x += borderUnitWidth) {
        ctx.drawImage(this.images.border, x, bottomPatternY, borderUnitWidth, borderThickness);
      }
      ctx.restore();
    }

    // LEFT BORDER (Rotated 90 deg)
    ctx.save();
    ctx.beginPath();
    ctx.rect(inset - (20 / 24) * borderThickness, inset, borderThickness, height - 2 * inset);
    ctx.clip();
    for (let y = inset; y < height - inset; y += borderUnitWidth) {
      ctx.save();
      ctx.translate(inset + borderThickness - (20 / 24) * borderThickness, y);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(this.images.border, 0, 0, borderUnitWidth, borderThickness);
      ctx.restore();
    }
    ctx.restore();

    // RIGHT BORDER (Rotated -90 deg)
    ctx.save();
    ctx.beginPath();
    ctx.rect(width - inset - borderThickness + (20 / 24) * borderThickness, inset, borderThickness, height - 2 * inset);
    ctx.clip();
    for (let y = inset; y < height - inset; y += borderUnitWidth) {
      ctx.save();
      ctx.translate(width - inset - borderThickness + (20 / 24) * borderThickness, y + borderUnitWidth);
      ctx.rotate(-Math.PI / 2);
      ctx.drawImage(this.images.border, 0, 0, borderUnitWidth, borderThickness);
      ctx.restore();
    }
    ctx.restore();

    // ----------------------------------------------------
    // 2. Draw Bottom Center Special Emblem
    // ----------------------------------------------------
    ctx.drawImage(this.images.centerBottom, centerX, centerY, centerWidth, centerHeight);

    // If custom text differs from the couple default, render dynamic text on top
    const textValue = (customOptions.customText || "Nataly & Jorge").trim();
    if (
      textValue &&
      textValue.toLowerCase() !== "nataly & jorge" &&
      textValue.toLowerCase() !== "nataly y jorge"
    ) {
      ctx.save();
      // Mask existing name area with clean dark radial gradient
      const maskX = centerX + centerWidth * 0.22;
      const maskY = centerY + centerHeight * 0.35;
      const maskW = centerWidth * 0.56;
      const maskH = centerHeight * 0.35;

      ctx.fillStyle = "rgba(18, 16, 12, 0.95)";
      ctx.beginPath();
      ctx.ellipse(centerX + centerWidth / 2, maskY + maskH / 2, maskW / 2, maskH / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Render custom text with calligraphy style
      ctx.font = `italic bold ${Math.round(20 * (centerWidth / 360))}px 'Great Vibes', 'Cinzel', cursive, serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#FFDF73";
      ctx.shadowColor = "#000000";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 1;
      ctx.fillText(textValue, centerX + centerWidth / 2, maskY + maskH / 2);
      ctx.restore();
    }

    // ----------------------------------------------------
    // 3. Draw Floral Corner Vignettes on Top (Organic & Natural)
    // ----------------------------------------------------
    // Top-Left
    ctx.drawImage(this.images.cornerTL, 0, 0, cornerSize, cornerSize);
    // Top-Right
    ctx.drawImage(this.images.cornerTR, width - cornerSize, 0, cornerSize, cornerSize);
    // Bottom-Left
    ctx.drawImage(this.images.cornerBL, 0, height - cornerSize, cornerSize, cornerSize);
    // Bottom-Right
    ctx.drawImage(this.images.cornerBR, width - cornerSize, height - cornerSize, cornerSize, cornerSize);

    ctx.restore();
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = FrameRenderer;
}
