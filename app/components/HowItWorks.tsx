"use client";

const steps = [
  {
    num: "01",
    title: "Connect & Verify",
    desc: "Link your wallet and Twitter to enter the arena. Your identity is your badge — verified, secure, and Web3-native.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "Draft Your Squad",
    desc: "Pick elite players from the Premier League and IPL. Analyze form, stats, and market value to build a championship roster.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "Compete & Earn",
    desc: "Real-time scoring as action unfolds. Every goal, every wicket, every run. Climb the ladder and claim on-chain rewards.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section className="py-[120px] px-[60px] max-md:py-[80px] max-md:px-5 relative" id="how">
      <h2
        className="reveal text-center mb-16"
        style={{
          fontFamily: "'Teko', sans-serif",
          fontSize: "3.5rem",
          textTransform: "uppercase",
          letterSpacing: "3px",
        }}
      >
        How <span style={{ color: "var(--accent-neon)" }}>It Works</span>
      </h2>

      <div className="grid grid-cols-3 max-md:grid-cols-1 gap-[30px] max-w-[1200px] mx-auto">
        {steps.map((s, i) => (
          <div
            key={i}
            className="step-card reveal data-hover"
            style={{ animationDelay: `${i * 0.15}s` }}
          >
            <div
              style={{
                fontFamily: "'Teko', sans-serif",
                fontSize: "5rem",
                color: "rgba(0, 255, 136, 0.08)",
                lineHeight: 1,
                position: "absolute",
                top: "10px",
                right: "20px",
              }}
            >
              {s.num}
            </div>
            <div className="mb-6" style={{ color: "var(--accent-neon)" }}>
              {s.icon}
            </div>
            <h3
              style={{
                fontFamily: "'Teko', sans-serif",
                fontSize: "1.6rem",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "0.8rem",
              }}
            >
              {s.title}
            </h3>
            <p
              style={{
                color: "var(--text-secondary)",
                lineHeight: 1.7,
                fontSize: "1rem",
              }}
            >
              {s.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
