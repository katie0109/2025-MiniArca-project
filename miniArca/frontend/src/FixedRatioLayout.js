import React from "react";
import "./css/FixedRatioLayout.css";

export default function FixedRatioLayout({ children }) {
  return (
    <div className="fixed-wrapper">
      <div className="fixed-inner">
        {children}
      </div>
    </div>
  );
}
