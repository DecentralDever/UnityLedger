// src/components/ProgressBar.tsx
import React from "react";

interface ProgressBarProps {
  progress: number; // value from 0 to 100
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  return (
    <div style={{ width: "100%", background: "#eee", borderRadius: "4px", marginBottom: "1rem" }}>
      <div
        style={{
          width: `${progress}%`,
          background: "#09f",
          height: "8px",
          borderRadius: "4px",
          transition: "width 0.3s ease"
        }}
      />
    </div>
  );
};

export default ProgressBar;
