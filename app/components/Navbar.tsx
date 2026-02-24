"use client";

interface NavbarProps {
  onOpenOnboarding: () => void;
}

export default function Navbar({ onOpenOnboarding }: NavbarProps) {
  return (
    <nav
      className="fixed top-0 left-0 w-full z-[1000] h-20 flex items-center justify-between px-[60px]"
      style={{
        background: "rgba(5, 7, 13, 0.8)",
        backdropFilter: "blur(15px)",
        borderBottom: "1px solid var(--glass-border)",
      }}
    >
      <div
        className="data-hover flex items-center gap-3"
        style={{
          fontFamily: "'Teko', sans-serif",
          fontSize: "2.4rem",
          textTransform: "uppercase",
          letterSpacing: "3px",
        }}
      >
        <svg
          className="w-9 h-9"
          viewBox="0 0 24 24"
          fill="var(--accent-neon)"
        >
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
        </svg>
        Dream<span style={{ color: "var(--accent-neon)" }}>Team</span>
      </div>

      <div className="flex gap-10 items-center max-md:hidden">
        <a
          href="#how"
          className="data-hover no-underline uppercase tracking-[2px] text-[0.85rem] font-semibold transition-colors duration-300"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--accent-neon)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--text-secondary)")
          }
        >
          How It Works
        </a>
        <a
          href="#sports"
          className="data-hover no-underline uppercase tracking-[2px] text-[0.85rem] font-semibold transition-colors duration-300"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--accent-neon)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--text-secondary)")
          }
        >
          Sports
        </a>
        <button className="nav-cta data-hover" onClick={onOpenOnboarding}>
          Enter Arena
        </button>
      </div>
    </nav>
  );
}
