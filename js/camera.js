"use strict";

/**
 * CameraManager
 * Handles camera stream acquisition, camera switching (front/back),
 * track management, and iOS/Android compatibility constraints.
 */
class CameraManager {
  constructor(videoElement) {
    if (!videoElement) {
      throw new Error("CameraManager requires a valid HTMLVideoElement.");
    }
    this.video = videoElement;
    this.stream = null;
    this.currentFacingMode = "environment"; // default to rear camera for events, toggleable to front
    this.hasMultipleCameras = false;
    this.isStreamActive = false;

    // Configure video attributes for strict iOS Safari compatibility
    this.video.setAttribute("autoplay", "");
    this.video.setAttribute("playsinline", "");
    this.video.setAttribute("webkit-playsinline", "");
    this.video.muted = true;
    this.video.playsInline = true;
  }

  /**
   * Check if mediaDevices API is available in the current browser/context
   */
  static isSupported() {
    return !!(
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function"
    );
  }

  /**
   * Start camera stream with the requested facing mode
   * @param {string} [facingMode] - 'user' or 'environment'
   * @returns {Promise<MediaStream>}
   */
  async start(facingMode = this.currentFacingMode) {
    if (!CameraManager.isSupported()) {
      throw new Error(
        "Tu navegador o dispositivo no soporta acceso a la cámara. Asegúrate de usar HTTPS."
      );
    }

    // Stop any existing stream
    this.stop();

    this.currentFacingMode = facingMode;

    const constraints = {
      audio: true, // Needed for recording video with audio
      video: {
        facingMode: { ideal: this.currentFacingMode },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      // Fallback: If audio permission was denied or device lacks mic, try video only
      console.warn("Retrying with video-only constraints...", err);
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: constraints.video,
          audio: false,
        });
      } catch (videoErr) {
        // Fallback: try basic video without specific resolution
        console.warn("Retrying with minimal video constraints...", videoErr);
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }
    }

    this.video.srcObject = this.stream;

    // Await metadata and video play
    await new Promise((resolve) => {
      if (this.video.readyState >= 2) {
        resolve();
      } else {
        this.video.onloadedmetadata = () => resolve();
      }
    });

    try {
      await this.video.play();
    } catch (playErr) {
      console.warn("Autoplay was prevented by browser policy:", playErr);
    }

    this.isStreamActive = true;
    await this.checkAvailableCameras();
    return this.stream;
  }

  /**
   * Detect if multiple video input devices are available
   */
  async checkAvailableCameras() {
    try {
      if (!navigator.mediaDevices.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === "videoinput");
      this.hasMultipleCameras = videoDevices.length > 1;
    } catch (e) {
      this.hasMultipleCameras = true; // assume true as fallback
    }
  }

  /**
   * Toggle between selfie (user) and environment (back) camera
   */
  async toggleCamera() {
    const nextMode = this.currentFacingMode === "user" ? "environment" : "user";
    return this.start(nextMode);
  }

  /**
   * Stop all active stream tracks to release the hardware camera
   */
  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          // ignore teardown error
        }
      });
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
    this.isStreamActive = false;
  }

  /**
   * Get native video stream resolution
   */
  getVideoResolution() {
    return {
      width: this.video.videoWidth || 1280,
      height: this.video.videoHeight || 720,
    };
  }

  /**
   * Check if the current camera track is mirrored (selfie mode)
   */
  isSelfie() {
    return this.currentFacingMode === "user";
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = CameraManager;
}
