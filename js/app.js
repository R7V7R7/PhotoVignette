"use strict";

/**
 * Main Application Orchestrator
 */
document.addEventListener("DOMContentLoaded", async () => {
  // DOM Elements
  const videoElement = document.getElementById("cameraVideo");
  const overlayCanvas = document.getElementById("frameCanvasOverlay");
  const overlayCtx = overlayCanvas.getContext("2d");
  const viewport = document.getElementById("viewport");

  const permissionOverlay = document.getElementById("permissionOverlay");
  const btnStartCamera = document.getElementById("btnStartCamera");

  const btnFlipCamera = document.getElementById("btnFlipCamera");
  const btnSettings = document.getElementById("btnSettings");
  const btnCloseSettings = document.getElementById("btnCloseSettings");
  const btnSaveSettings = document.getElementById("btnSaveSettings");
  const settingsModal = document.getElementById("settingsModal");
  const inputCustomText = document.getElementById("inputCustomText");
  const eventBadge = document.getElementById("eventBadge");
  const qrCanvas = document.getElementById("qrCanvas");

  const btnModePhoto = document.getElementById("btnModePhoto");
  const btnModeVideo = document.getElementById("btnModeVideo");
  const btnShutter = document.getElementById("btnShutter");
  const recordingTimer = document.getElementById("recordingTimer");
  const timerText = document.getElementById("timerText");

  const previewModal = document.getElementById("previewModal");
  const previewContent = document.getElementById("previewContent");
  const btnRetake = document.getElementById("btnRetake");
  const btnShareDownload = document.getElementById("btnShareDownload");

  // State
  let currentMode = "photo"; // 'photo' or 'video'
  let customText = localStorage.getItem("photo_vignette_text") || "Nuestra Boda";
  let currentCapture = null; // { blob, url, type, filename }
  let timerInterval = null;
  let timerSeconds = 0;

  // Set initial UI text
  eventBadge.textContent = customText;
  inputCustomText.value = customText;

  // Initialize Core Modules
  const camera = new CameraManager(videoElement);
  const frame = new FrameRenderer();
  const recorder = new CaptureRecorder(camera, frame);

  // Resize Canvas Overlay to match viewport pixels
  const resizeOverlay = () => {
    const rect = viewport.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    overlayCanvas.width = rect.width * dpr;
    overlayCanvas.height = rect.height * dpr;
    overlayCanvas.style.width = `${rect.width}px`;
    overlayCanvas.style.height = `${rect.height}px`;

    overlayCtx.setTransform(1, 0, 0, 1, 0, 0); // Reset scale
    overlayCtx.scale(dpr, dpr);

    drawOverlayFrame();
  };

  const drawOverlayFrame = () => {
    const rect = viewport.getBoundingClientRect();
    overlayCtx.clearRect(0, 0, rect.width, rect.height);
    frame.draw(overlayCtx, rect.width, rect.height, { customText });
  };

  window.addEventListener("resize", resizeOverlay);
  window.addEventListener("orientationchange", () => {
    setTimeout(resizeOverlay, 250);
  });

  // Preload frame graphics
  try {
    await frame.loadAssets();
    resizeOverlay();
  } catch (err) {
    console.error("No se pudieron cargar los gráficos del marco:", err);
  }

  // Camera Activation
  const startCamera = async () => {
    try {
      await camera.start();
      permissionOverlay.classList.add("hidden");
      resizeOverlay();
      updateSelfieClass();
    } catch (err) {
      console.warn("Permiso de cámara no concedido de inmediato:", err);
      permissionOverlay.classList.remove("hidden");
    }
  };

  const updateSelfieClass = () => {
    if (camera.isSelfie()) {
      videoElement.classList.add("selfie-mode");
    } else {
      videoElement.classList.remove("selfie-mode");
    }
  };

  btnStartCamera.addEventListener("click", startCamera);

  // Flip Camera
  btnFlipCamera.addEventListener("click", async () => {
    btnFlipCamera.style.transform = "rotate(180deg)";
    setTimeout(() => (btnFlipCamera.style.transform = "none"), 300);
    try {
      await camera.toggleCamera();
      updateSelfieClass();
      resizeOverlay();
    } catch (err) {
      console.error("Error al cambiar cámara:", err);
    }
  });

  // Mode Selection
  btnModePhoto.addEventListener("click", () => {
    if (recorder.isRecording) return;
    currentMode = "photo";
    btnModePhoto.classList.add("active");
    btnModeVideo.classList.remove("active");
    btnShutter.classList.remove("video-mode");
  });

  btnModeVideo.addEventListener("click", () => {
    if (recorder.isRecording) return;
    currentMode = "video";
    btnModeVideo.classList.add("active");
    btnModePhoto.classList.remove("active");
    btnShutter.classList.add("video-mode");
  });

  // Timer helpers for video recording
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const startTimer = () => {
    timerSeconds = 0;
    timerText.textContent = "00:00";
    recordingTimer.classList.add("visible");
    timerInterval = setInterval(() => {
      timerSeconds++;
      timerText.textContent = formatTimer(timerSeconds);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    recordingTimer.classList.remove("visible");
  };

  // Shutter Action
  btnShutter.addEventListener("click", async () => {
    if (currentMode === "photo") {
      // Photo snapshot
      try {
        btnShutter.style.transform = "scale(0.85)";
        setTimeout(() => (btnShutter.style.transform = ""), 150);

        const capture = await recorder.capturePhoto({ customText });
        currentCapture = {
          blob: capture.blob,
          url: capture.url,
          type: "photo",
          filename: `foto-${Date.now()}.jpg`,
        };
        showPreview();
      } catch (err) {
        console.error("Error capturando foto:", err);
        alert("Ocurrió un error al capturar la foto.");
      }
    } else {
      // Video recording toggle
      if (!recorder.isRecording) {
        // Start video
        try {
          recorder.startVideoRecording({ customText });
          btnShutter.classList.add("recording");
          startTimer();
        } catch (err) {
          console.error("Error iniciando grabación:", err);
          alert("No se pudo iniciar la grabación de video en este navegador.");
        }
      } else {
        // Stop video
        try {
          btnShutter.classList.remove("recording");
          stopTimer();
          const videoData = await recorder.stopVideoRecording();
          currentCapture = {
            blob: videoData.blob,
            url: videoData.url,
            type: "video",
            filename: `video-${Date.now()}.${videoData.extension}`,
          };
          showPreview();
        } catch (err) {
          console.error("Error deteniendo grabación:", err);
        }
      }
    }
  });

  // Preview Modal Display
  const showPreview = () => {
    if (!currentCapture) return;

    previewContent.innerHTML = "";
    if (currentCapture.type === "photo") {
      const img = document.createElement("img");
      img.src = currentCapture.url;
      img.className = "preview-media";
      img.alt = "Foto capturada con marco";
      previewContent.appendChild(img);
    } else {
      const video = document.createElement("video");
      video.src = currentCapture.url;
      video.className = "preview-media";
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      previewContent.appendChild(video);
    }

    previewModal.classList.remove("hidden");
  };

  const closePreview = () => {
    if (currentCapture && currentCapture.url) {
      URL.revokeObjectURL(currentCapture.url);
      currentCapture = null;
    }
    previewContent.innerHTML = "";
    previewModal.classList.add("hidden");
  };

  btnRetake.addEventListener("click", closePreview);

  btnShareDownload.addEventListener("click", async () => {
    if (!currentCapture) return;
    try {
      await recorder.shareOrDownload(
        currentCapture.blob,
        currentCapture.filename,
        customText
      );
    } catch (err) {
      console.error("Error al compartir/descargar:", err);
    }
  });

  // Settings & QR Modal
  const openSettings = () => {
    // Generate QR with current URL or custom URL
    const targetUrl = window.location.href;
    SimpleQR.draw(qrCanvas, targetUrl, 180);
    settingsModal.classList.remove("hidden");
  };

  const closeSettings = () => {
    settingsModal.classList.add("hidden");
  };

  btnSettings.addEventListener("click", openSettings);
  btnCloseSettings.addEventListener("click", closeSettings);

  btnSaveSettings.addEventListener("click", () => {
    const newText = inputCustomText.value.trim() || "Nuestra Boda";
    customText = newText;
    localStorage.setItem("photo_vignette_text", customText);
    eventBadge.textContent = customText;
    drawOverlayFrame();
    closeSettings();
  });

  // Attempt automatic camera start on page load
  startCamera();
});
