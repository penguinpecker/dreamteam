"use client";

const panels = [
  {
    cls: "cricket",
    tag: "Indian Premier League",
    title: "Cricket Arena",
    desc: "Draft batsmen, bowlers, and all-rounders from the world's most electrifying T20 league.",
    items: [
      "Live ball-by-ball scoring",
      "Player performance multipliers",
      "Match day power boosts",
    ],
  },
  {
    cls: "football",
    tag: "Premier League",
    title: "Football Arena",
    desc: "Build your dream XI from the most competitive football league on the planet.",
    items: [
      "Real-time goal & assist tracking",
      "Clean sheet bonuses",
      "Gameweek captain picks",
    ],
  },
];

export default function Showcase() {
  return (
    <div
      id="sports"
      className="grid grid-cols-2 max-md:grid-cols-1 min-h-[500px]"
      style={{
        borderTop: "1px solid var(--glass-border)",
        borderBottom: "1px solid var(--glass-border)",
      }}
    >
      {panels.map((p, i) => (
        <div key={i} className={`showcase-panel ${p.cls} reveal`}>
          <div className="relative z-[2]">
            <div
              className="mb-4"
              style={{
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "4px",
                color: "var(--accent-neon)",
              }}
            >
              {p.tag}
            </div>
            <h3
              style={{
                fontFamily: "'Teko', sans-serif",
                fontSize: "3rem",
                textTransform: "uppercase",
                letterSpacing: "2px",
                marginBottom: "1rem",
              }}
            >
              {p.title}
            </h3>
            <p
              style={{
                color: "var(--text-secondary)",
                lineHeight: 1.7,
                maxWidth: "400px",
              }}
            >
              {p.desc}
            </p>
            <ul className="flex flex-col gap-2.5 mt-6 list-none">
              {p.items.map((item, j) => (
                <li
                  key={j}
                  className="flex items-center gap-2.5"
                  style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}
                >
                  <span
                    className="block w-1.5 h-1.5"
                    style={{
                      background: "var(--accent-neon)",
                      clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                    }}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}
