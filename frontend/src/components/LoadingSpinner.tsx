// src/components/LoadingSpinner.tsx
import React from "react";
import "./LoadingSpinner.css";

const LoadingSpinner: React.FC = () => {
  return (
    <div className="spinner-container">
      <div className="spinner" />
    </div>
  );
};

export default LoadingSpinner;
