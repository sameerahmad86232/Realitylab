import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  Camera,
  SwitchCamera,
  X,
  Check,
  RotateCcw,
  ImagePlus,
} from "lucide-react";
import {
  captureVideoFrame,
  cameraErrorMessage,
  stopCamera,
} from "../lib/camera";

export default function CameraCapture({ onPhoto, onClose, onDevicePhoto }) {
  const dialog = useRef(null),
    video = useRef(null),
    stream = useRef(null),
    generation = useRef({ value: 0 }),
    alive = useRef(true),
    previewUrl = useRef(null);
  const [facing, setFacing] = useState("environment"),
    [photo, setPhoto] = useState(null),
    [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [capturing, setCapturing] = useState(false),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    const token = generation.current;
    alive.current = true;
    dialog.current.showModal();
    return () => {
      alive.current = false;
      token.value++;
      stopCamera(stream.current);
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    };
  }, []);
  useEffect(() => {
    if (photo) return;
    const token = generation.current;
    const id = ++token.value;
    setReady(false);
    setError("");
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError(
        "Live camera preview needs HTTPS and a supported browser. Use your device camera or choose an existing photo instead.",
      );
      return;
    }
    const element = video.current;
    navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1600 },
          height: { ideal: 1200 },
        },
      })
      .then(async (media) => {
        if (id !== token.value || !alive.current) {
          stopCamera(media);
          return;
        }
        stream.current = media;
        element.srcObject = media;
        try {
          await element.play();
        } catch {
          if (alive.current && id === token.value)
            setError("Tap Start preview to play the camera feed.");
        }
      })
      .catch((e) => {
        if (alive.current && id === token.value)
          setError(cameraErrorMessage(e));
      });
    return () => {
      token.value++;
      stopCamera(stream.current);
      stream.current = null;
      element.srcObject = null;
    };
  }, [facing, photo, retry]);
  async function capture() {
    if (!ready || capturing) return;
    setCapturing(true);
    setError("");
    try {
      const file = await captureVideoFrame(video.current);
      if (!alive.current) return;
      const url = URL.createObjectURL(file);
      previewUrl.current = url;
      stopCamera(stream.current);
      setPhoto({ file, url });
    } catch (e) {
      if (alive.current) setError(e.message);
    } finally {
      if (alive.current) setCapturing(false);
    }
  }
  function retake() {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = null;
    setPhoto(null);
    setReady(false);
  }
  return (
    <dialog
      className="camera-dialog"
      ref={dialog}
      aria-labelledby="camera-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialog.current) {
          const r = dialog.current.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div className="camera-heading">
        <div>
          <span className="eyebrow">CAPTURE / LOCAL PREVIEW</span>
          <h3 id="camera-title">
            {photo ? "A closer look." : "Bring your object into view."}
          </h3>
        </div>
        <button
          className="quiet-button"
          aria-label="Close camera"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>
      <div className="camera-stage">
        {photo ? (
          <img src={photo.url} alt="Captured object photo for review" />
        ) : (
          <>
            <video
              ref={video}
              autoPlay
              playsInline
              muted
              aria-label="Live object camera preview"
              onCanPlay={() => {
                if (video.current?.videoWidth) setReady(true);
              }}
            />
            {!ready && !error && (
              <p role="status">Waiting for camera permission and preview…</p>
            )}
            <span className="camera-guide" aria-hidden="true" />
          </>
        )}
      </div>
      {error && (
        <p role="alert" className="camera-error">
          {error}
        </p>
      )}
      <p className="camera-disclosure">
        The preview stays on your device. Only photos you keep will be added to
        the explorer. Analysis still needs your consent and an explicit click.
      </p>
      <div className="camera-actions">
        {photo ? (
          <>
            <button className="quiet-button" onClick={retake}>
              <RotateCcw size={15} /> Retake photo
            </button>
            <button
              className="button-lime"
              onClick={() => {
                onPhoto(photo.file);
                onClose();
              }}
            >
              <Check size={16} /> Use this photo
            </button>
          </>
        ) : (
          <>
            <button
              className="quiet-button"
              aria-label="Switch camera"
              disabled={capturing}
              onClick={() =>
                setFacing((f) => (f === "environment" ? "user" : "environment"))
              }
            >
              <SwitchCamera size={16} /> Switch camera
            </button>
            <button
              className="button-lime"
              disabled={!ready || capturing}
              onClick={capture}
            >
              <Camera size={16} /> {capturing ? "Capturing…" : "Capture photo"}
            </button>
          </>
        )}
      </div>
      {!photo && error && (
        <div className="camera-recovery">
          <button
            className="quiet-button"
            onClick={() => {
              if (stream.current)
                video.current
                  ?.play()
                  .then(() => setError(""))
                  .catch((e) => setError(cameraErrorMessage(e)));
              else setRetry((r) => r + 1);
            }}
          >
            Start preview
          </button>
          <button
            className="quiet-button"
            onClick={() => {
              onClose();
              onDevicePhoto();
            }}
          >
            <ImagePlus size={15} /> Use device camera or photo
          </button>
        </div>
      )}
    </dialog>
  );
}
CameraCapture.propTypes = {
  onPhoto: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onDevicePhoto: PropTypes.func.isRequired,
};
