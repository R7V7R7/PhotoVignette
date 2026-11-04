"use strict";

/**
 * CaptureRecorder
 * Manages photo snapshots with frame compositing,
 * video recording via Canvas stream & MediaRecorder,
 * and native file sharing / downloading.
 */
class CaptureRecorder {
  constructor(cameraManager, frameRenderer) {
    this.camera = cameraManager;
    this.frame = frameRenderer;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
    this.recordCanvas = null;
    this.recordCtx = null;
    this.recordAnimationId = null;
  }

  /**
   * Capture a high-resolution photo with frame overlay
   * @param {Object} [customOptions] - Optional text/date customization
   * @returns {Promise<{blob: Blob, url: string, width: number, height: number}>}
   */
  async capturePhoto(customOptions = {}) {
    const video = this.camera.video;
    const vWidth = video.videoWidth || 1080;
    const vHeight = video.videoHeight || 1920;

    const canvas = document.createElement("canvas");
    canvas.width = vWidth;
    canvas.height = vHeight;
    const ctx = canvas.getContext("2d");

    // 1. Draw camera video frame
    ctx.save();
    if (this.camera.isSelfie()) {
      // Mirror horizontally for selfie
      ctx.translate(vWidth, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, vWidth, vHeight);
    ctx.restore();

    // 2. Draw the decorative frame on top
    this.frame.draw(ctx, vWidth, vHeight, customOptions);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Error al generar imagen capturada"));
            return;
          }
          const url = URL.createObjectURL(blob);
          resolve({ blob, url, width: vWidth, height: vHeight });
        },
        "image/jpeg",
        0.95
      );
    });
  }

  /**
   * Find the best supported mimeType for MediaRecorder
   */
  getSupportedMimeType() {
    const types = [
      "video/mp4;codecs=avc1,mp4a.40.2",
      "video/mp4",
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ];

    for (const type of types) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return "";
  }

  /**
   * Start recording video with the frame composited continuously
   * @param {Object} [customOptions]
   */
  startVideoRecording(customOptions = {}) {
    if (this.isRecording) return;

    const video = this.camera.video;
    const vWidth = video.videoWidth || 720;
    const vHeight = video.videoHeight || 1280;

    this.recordCanvas = document.createElement("canvas");
    this.recordCanvas.width = vWidth;
    this.recordCanvas.height = vHeight;
    this.recordCtx = this.recordCanvas.getContext("2d");

    const isSelfie = this.camera.isSelfie();

    // Continuous rendering loop onto the recording canvas
    const renderFrame = () => {
      if (!this.isRecording) return;

      this.recordCtx.save();
      if (isSelfie) {
        this.recordCtx.translate(vWidth, 0);
        this.recordCtx.scale(-1, 1);
      }
      this.recordCtx.drawImage(video, 0, 0, vWidth, vHeight);
      this.recordCtx.restore();

      // Render frame over video
      this.frame.draw(this.recordCtx, vWidth, vHeight, customOptions);

      this.recordAnimationId = requestAnimationFrame(renderFrame);
    };

    // Capture canvas stream at 30fps
    const canvasStream = this.recordCanvas.captureStream(30);

    // Attach audio track if available from original camera stream
    if (this.camera.stream) {
      const audioTracks = this.camera.stream.getAudioTracks();
      if (audioTracks.length > 0) {
        canvasStream.addTrack(audioTracks[0]);
      }
    }

    const mimeType = this.getSupportedMimeType();
    const options = mimeType ? { mimeType } : undefined;

    this.recordedChunks = [];
    this.mediaRecorder = new MediaRecorder(canvasStream, options);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.isRecording = true;
    renderFrame();
    this.mediaRecorder.start(100); // 100ms chunks for smooth recording
  }

  /**
   * Stop video recording and return the resulting video blob
   * @returns {Promise<{blob: Blob, url: string, extension: string}>}
   */
  stopVideoRecording() {
    return new Promise((resolve, reject) => {
      if (!this.isRecording || !this.mediaRecorder) {
        reject(new Error("No hay grabación activa"));
        return;
      }

      this.mediaRecorder.onstop = () => {
        this.isRecording = false;
        if (this.recordAnimationId) {
          cancelAnimationFrame(this.recordAnimationId);
          this.recordAnimationId = null;
        }

        const mimeType = this.mediaRecorder.mimeType || "video/mp4";
        const isMp4 = mimeType.includes("mp4");
        const blob = new Blob(this.recordedChunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const extension = isMp4 ? "mp4" : "webm";

        this.recordCanvas = null;
        this.recordCtx = null;
        resolve({ blob, url, extension });
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Trigger native share or direct download
   * @param {Blob} blob - Captured media blob
   * @param {string} filename - Filename with extension
   * @param {string} title - Share title
   */
  async shareOrDownload(blob, filename, title = "Foto con marco") {
    const file = new File([blob], filename, { type: blob.type });

    // Try Web Share API with files if supported
    if (
      navigator.canShare &&
      navigator.canShare({ files: [file] }) &&
      navigator.share
    ) {
      try {
        await navigator.share({
          files: [file],
          title: title,
          text: "¡Mira la foto de nuestro evento especial!",
        });
        return { shared: true };
      } catch (err) {
        // User aborted share dialog or permission denied, fall through to download
        if (err.name === "AbortError") {
          return { aborted: true };
        }
      }
    }

    // Direct download fallback
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return { downloaded: true };
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = CaptureRecorder;
}
