"use client";

interface HeroProps {
  onOpenOnboarding: () => void;
}

export default function Hero({ onOpenOnboarding }: HeroProps) {
  return (
    <section className="relative h-screen flex justify-center items-center text-center overflow-hidden">
      {/* Video Background */}
      <div className="video-bg-full">
        <video autoPlay muted loop playsInline>
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Overlay */}
      <div
        className="absolute top-0 left-0 w-full h-full z-[-1]"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(0,255,136,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Content */}
      <div
        className="relative z-5"
        style={{ animation: "fadeUp 1s var(--easing) 2.5s both" }}
      >
        {/* Eyebrow */}
        <div
          className="flex items-center justify-center gap-4 mb-4"
          style={{
            fontSize: "0.85rem",
            textTransform: "uppercase",
            letterSpacing: "6px",
            color: "var(--accent-neon)",
          }}
        >
          <span
            className="block w-10 h-px opacity-50"
            style={{ background: "var(--accent-neon)" }}
          />
          Fantasy Sports Reimagined
          <span
            className="block w-10 h-px opacity-50"
            style={{ background: "var(--accent-neon)" }}
          />
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: "'Teko', sans-serif",
            fontSize: "clamp(4.5rem, 11vw, 10rem)",
            lineHeight: 0.85,
            textTransform: "uppercase",
            letterSpacing: "4px",
            marginBottom: "1.5rem",
            textShadow: "0 0 60px rgba(0,0,0,0.8)",
            animation: "text-flicker 6s infinite",
          }}
        >
          Dream
          <br />
          Team
        </h1>

        {/* Subtitle */}
        <p
          className="mx-auto mb-12"
          style={{
            fontSize: "1.2rem",
            color: "var(--text-secondary)",
            maxWidth: "500px",
            lineHeight: 1.6,
          }}
        >
          Build your ultimate squad from{" "}
          <strong className="text-white">Premier League</strong> and{" "}
          <strong className="text-white">IPL</strong> rosters. Compete in
          real-time. Climb the leaderboard. Earn rewards.
        </p>

        {/* CTA */}
        <button className="hero-cta data-hover" onClick={onOpenOnboarding}>
          Join The Arena
        </button>
      </div>
    </section>
  );
}
