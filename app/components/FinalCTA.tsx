"use client";

interface FinalCTAProps {
  onOpenOnboarding: () => void;
}

export default function FinalCTA({ onOpenOnboarding }: FinalCTAProps) {
  return (
    <section
      className="text-center py-[120px] px-5"
      style={{
        background:
          "radial-gradient(ellipse at 50% 50%, rgba(0,255,136,0.04) 0%, transparent 60%)",
      }}
    >
      <h2
        className="reveal"
        style={{
          fontFamily: "'Teko', sans-serif",
          fontSize: "clamp(3rem, 6vw, 5rem)",
          textTransform: "uppercase",
          letterSpacing: "3px",
          marginBottom: "1rem",
        }}
      >
        Ready to{" "}
        <span style={{ color: "var(--accent-neon)" }}>Dominate</span>?
      </h2>
      <p
        className="reveal"
        style={{
          color: "var(--text-secondary)",
          fontSize: "1.1rem",
          marginBottom: "2.5rem",
        }}
      >
        Early access spots are filling up. Connect now and secure your position.
      </p>
      <button
        className="hero-cta data-hover reveal"
        onClick={onOpenOnboarding}
      >
        Enter The Arena
      </button>
    </section>
  );
}
