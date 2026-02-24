"use client";

import { useEffect, useState } from "react";

export default function Loader() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 2200);
    const t2 = setTimeout(() => setVisible(false), 3000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      id="loader-overlay"
      style={{ opacity: fading ? 0 : 1 }}
    >
      <div className="halo-loader">
        <div className="halo-ring" />
      </div>
      <div className="loader-text">Initializing Arena</div>
    </div>
  );
}
