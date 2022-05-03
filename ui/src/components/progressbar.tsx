import React = require("react");

export function ProgressBar({ progress }: { progress: number | undefined }) {
  return (
    <div className="progress">
      <div
        className="progress-bar progress-bar-striped progress-bar-animated"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{
          width: progress !== undefined ? `${progress * 100}%` : "100%",
        }}
      >
        {/* {progress !== undefined ? (progress * 100).toFixed(1) : ""} */}
      </div>
    </div>
  );
}
