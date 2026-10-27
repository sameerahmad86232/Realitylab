import PropTypes from "prop-types";
import { ArrowUpRight, Loader2, RotateCcw } from "lucide-react";
export default function ActionArea({
  hasFiles,
  isLoading,
  onGenerate,
  hasGenerated,
}) {
  return (
    <div className="generation-area">
      <div>
        <span className="micro-label">THE NEXT CHAPTER</span>
        <p>
          {isLoading
            ? "Preparing your sample exploration…"
            : hasFiles
              ? "A different perspective is one click away."
              : "Your next discovery starts with a photo."}
        </p>
      </div>
      <button
        className="button-lime"
        disabled={!hasFiles || isLoading}
        onClick={onGenerate}
      >
        {isLoading ? (
          <Loader2 size={16} className="spin" />
        ) : hasGenerated ? (
          <RotateCcw size={15} />
        ) : null}
        {isLoading
          ? "Preparing blueprint…"
          : hasGenerated
            ? "Explore again"
            : "Explore sample blueprint"}
        <ArrowUpRight size={17} />
      </button>
    </div>
  );
}

ActionArea.propTypes = {
  hasFiles: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool.isRequired,
  onGenerate: PropTypes.func.isRequired,
  hasGenerated: PropTypes.bool.isRequired,
};
