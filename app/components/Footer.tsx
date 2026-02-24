export default function Footer() {
  const links = ["Terms", "Privacy", "Discord", "Twitter"];

  return (
    <footer
      className="flex max-md:flex-col max-md:gap-5 max-md:text-center justify-between items-center px-[60px] max-md:px-5 py-10"
      style={{ borderTop: "1px solid var(--glass-border)" }}
    >
      <div
        style={{
          fontFamily: "'Teko', sans-serif",
          fontSize: "1.4rem",
          textTransform: "uppercase",
          letterSpacing: "2px",
          color: "var(--text-secondary)",
        }}
      >
        DreamTeam © 2026
      </div>
      <div className="flex gap-[30px]">
        {links.map((l) => (
          <a
            key={l}
            href="#"
            className="data-hover no-underline transition-colors duration-300"
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.8rem",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--accent-neon)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-secondary)")
            }
          >
            {l}
          </a>
        ))}
      </div>
    </footer>
  );
}
