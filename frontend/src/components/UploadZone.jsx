import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Upload,
  Plus,
  X,
  ImagePlus,
  Sparkles,
  AlertCircle,
} from "lucide-react";

export default function UploadZone({ files, setFiles, onSelectSample }) {
  const input = useRef(null);
  const ownedUrls = useRef(new Set());
  useEffect(() => {
    const urls = ownedUrls.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);
  useEffect(() => {
    const active = new Set(files.map((file) => file.preview));
    for (const url of ownedUrls.current) {
      if (!active.has(url)) {
        URL.revokeObjectURL(url);
        ownedUrls.current.delete(url);
      }
    }
  }, [files]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  function addFiles(incoming) {
    const images = Array.from(incoming).filter((f) =>
      ["image/jpeg", "image/png", "image/webp"].includes(f.type),
    );
    const valid = images.filter((f) => f.size <= 5 * 1024 * 1024);
    setError(
      images.length !== incoming.length
        ? "Choose JPG, PNG or WebP images."
        : valid.length !== images.length
          ? "Each image must be under 5 MB."
          : files.length + valid.length > 3
            ? "Your exploration can include up to 3 photos."
            : "",
    );
    const additions = valid
      .slice(0, Math.max(0, 3 - files.length))
      .map((f) => {
        const preview = URL.createObjectURL(f);
        ownedUrls.current.add(preview);
        return ({
        id: crypto.randomUUID(),
        name: f.name,
        size: `${(f.size / 1024).toFixed(1)} KB`,
        preview,
        rawFile: f,
      });
      });
    if (additions.length) setFiles((previous) => [...previous, ...additions]);
  }
  function remove(id) {
    const file = files.find((f) => f.id === id);
    if (file && !file.isSample) URL.revokeObjectURL(file.preview);
    setFiles((previous) => previous.filter((f) => f.id !== id));
  }
  return (
    <div className="upload-component">
      <input
        ref={input}
        className="visually-hidden"
        type="file"
        aria-label="Upload object photos"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {files.length === 0 ? (
        <div
          className={`upload-drop ${dragging ? "dragging" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
        >
          <div className="upload-illustration" aria-hidden="true">
            <div className="photo-card photo-back">
              <span />
              <span />
              <span />
            </div>
            <div className="photo-card photo-front">
              <ImagePlus size={35} />
              <span>YOUR NEXT DISCOVERY</span>
            </div>
            <div className="upload-float">
              <Plus size={17} />
            </div>
          </div>
          <h3>What caught your curiosity?</h3>
          <p>Drop your photos here, or choose a few to explore.</p>
          <button
            className="button-lime"
            onClick={() => input.current?.click()}
          >
            <Upload size={15} /> Choose photos <ArrowUpRight size={16} />
          </button>
          <span className="upload-limits">
            UP TO 3 IMAGES · JPG, PNG, WEBP · 5 MB EACH
          </span>
        </div>
      ) : (
        <div className="photo-selection">
          <div className="selection-heading">
            <span>
              <span className="live-dot" /> {files.length} of 3 photos selected
            </span>
            <button
              onClick={() => {
                files.forEach((f) => {
                  if (!f.isSample) URL.revokeObjectURL(f.preview);
                });
                setFiles([]);
              }}
            >
              Clear all <X size={12} />
            </button>
          </div>
          <div className="photo-grid">
            {files.map((file, i) => (
              <article className="selected-photo" key={file.id}>
                <div className="photo-preview">
                  <img src={file.preview} alt={file.name} />
                  <span>VIEW 0{i + 1}</span>
                  <button
                    aria-label={`Remove ${file.name}`}
                    onClick={() => remove(file.id)}
                  >
                    <X size={13} />
                  </button>
                </div>
                <strong>{file.name}</strong>
                <small>{file.isSample ? "CURATED SAMPLE" : file.size}</small>
              </article>
            ))}
            {files.length < 3 && (
              <button
                className="add-photo"
                onClick={() => input.current?.click()}
              >
                <Plus size={24} />
                <span>Another angle?</span>
                <small>ADD PHOTO 0{files.length + 1}</small>
              </button>
            )}
          </div>
        </div>
      )}
      {error && (
        <p className="upload-error" role="alert">
          <AlertCircle size={15} />
          {error}
        </p>
      )}
      <div className="sample-invitation">
        <span className="sample-icon">
          <Sparkles size={18} />
        </span>
        <div>
          <strong>Just looking around?</strong>
          <p>Explore an original electric grand tourer.</p>
        </div>
        <button onClick={onSelectSample}>
          Load sample <ArrowUpRight size={15} />
        </button>
      </div>
    </div>
  );
}

UploadZone.propTypes = {
  files: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      size: PropTypes.string,
      preview: PropTypes.string.isRequired,
      isSample: PropTypes.bool,
    }),
  ).isRequired,
  setFiles: PropTypes.func.isRequired,
  onSelectSample: PropTypes.func.isRequired,
};
