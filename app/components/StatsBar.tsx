"use client";

const stats = [
  { number: "48,000+", label: "Players on Waitlist" },
  { number: "$2.4M", label: "Season Prize Pool" },
  { number: "120+", label: "Live Leagues" },
  { number: "2", label: "Sports — Cricket & Football" },
];

export default function StatsBar() {
  return (
    <div
      className="flex justify-center gap-[60px] max-md:gap-[30px] max-md:flex-wrap py-10 px-5"
      style={{
        background: "rgba(5, 7, 13, 0.7)",
        borderTop: "1px solid var(--glass-border)",
        borderBottom: "1px solid var(--glass-border)",
        animation: "fadeUp 1s var(--easing) 2.8s both",
      }}
    >
      {stats.map((s, i) => (
        <div key={i} className="reveal text-center">
          <div
            style={{
              fontFamily: "'Teko', sans-serif",
              fontSize: "3rem",
              color: "var(--accent-neon)",
              lineHeight: 1,
            }}
          >
            {s.number}
          </div>
          <div
            className="mt-1"
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "2px",
              color: "var(--text-secondary)",
            }}
          >
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}
