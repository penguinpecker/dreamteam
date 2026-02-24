"use client";

import { useState, useRef } from "react";

interface OnboardingPopupProps {
  open: boolean;
  onClose: () => void;
}

const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const CricketIcon = ({ active, completed }: { active: boolean; completed: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={completed ? "#0A0E1A" : active ? "#00FF88" : "#8892b0"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="6" r="2.5" fill={completed ? "#0A0E1A" : active ? "#00FF88" : "none"} />
    <line x1="4" y1="20" x2="14" y2="10" />
    <line x1="12" y1="12" x2="15" y2="15" />
    <line x1="3" y1="21" x2="5" y2="19" />
  </svg>
);

const FootballIcon = ({ active, completed }: { active: boolean; completed: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={completed ? "#0A0E1A" : active ? "#00FF88" : "#8892b0"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2l3 7h-6l3-7z" />
    <path d="M2.5 9.5l6.5 2-2.5 6z" />
    <path d="M21.5 9.5l-6.5 2 2.5 6z" />
    <polygon points="12,8 15.5,11 14,15.5 10,15.5 8.5,11" />
  </svg>
);

const TrophyIcon = ({ active, completed }: { active: boolean; completed: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={completed ? "#0A0E1A" : active ? "#00FF88" : "#8892b0"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

const stepIcons = [CricketIcon, FootballIcon, TrophyIcon];

export default function OnboardingPopup({ open, onClose }: OnboardingPopupProps) {
  const [step, setStep] = useState(1);
  const [connecting, setConnecting] = useState(false);
  const [refLink, setRefLink] = useState("dreamteam.gg/join/ALPHA-992");
  const [copied, setCopied] = useState(false);
  const refInputRef = useRef<HTMLInputElement>(null);

  const completeStep = (current: number) => {
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      if (current === 2) {
        const handles = ["CryptoKing", "Web3Warrior", "FantasyPro", "ArenaChamp"];
        const handle = handles[Math.floor(Math.random() * handles.length)];
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        setRefLink(`dreamteam.gg/join/${handle}-${code}`);
      }
      setStep(current + 1);
    }, 1500);
  };

  const copyRef = () => {
    if (refInputRef.current) {
      refInputRef.current.select();
      document.execCommand("copy");
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnTwitter = () => {
    const text = encodeURIComponent(
      `I just secured my spot in the DreamTeam fantasy arena 🏏⚽🛡️\n\nJoin with my link and we both climb the leaderboard:\nhttps://${refLink}\n\n#DreamTeam #FantasySports #Web3`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (
      (e.target as HTMLElement).classList.contains("onboarding-overlay") ||
      (e.target as HTMLElement).closest(".onboarding-bg")
    ) {
      onClose();
    }
  };

  const shieldClip =
    "polygon(50% 0%, 98% 6%, 100% 52%, 82% 80%, 50% 100%, 18% 80%, 0% 52%, 2% 6%)";

  return (
    <div
      className="onboarding-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 50000,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        opacity: open ? 1 : 0,
        pointerEvents: open ? "auto" : "none",
        transition: "opacity 0.5s var(--easing)",
      }}
      onClick={handleOverlayClick}
    >
      {/* Video BG */}
      <div
        className="onboarding-bg"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          zIndex: 0,
        }}
      >
        <div style={{ position: "relative", overflow: "hidden" }}>
          <video
            autoPlay
            muted
            loop
            playsInline
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "brightness(0.15) contrast(1.3) saturate(0.6)",
            }}
          >
            <source
              src="https://cdn.coverr.co/videos/coverr-cricket-player-hitting-a-ball-5765/1080p.mp4"
              type="video/mp4"
            />
          </video>
        </div>
        <div style={{ position: "relative", overflow: "hidden" }}>
          <video
            autoPlay
            muted
            loop
            playsInline
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "brightness(0.15) contrast(1.3) saturate(0.6)",
            }}
          >
            <source
              src="https://cdn.coverr.co/videos/coverr-soccer-ball-kick-close-up-4910/1080p.mp4"
              type="video/mp4"
            />
          </video>
        </div>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(5, 7, 13, 0.85)",
            backdropFilter: "blur(8px)",
          }}
        />
      </div>

      {/* Shield */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "460px",
          maxWidth: "92vw",
        }}
      >
        {/* Glow border */}
        <div
          style={{
            position: "absolute",
            top: "-2px",
            left: "-2px",
            width: "calc(100% + 4px)",
            height: "calc(100% + 4px)",
            clipPath: shieldClip,
            background:
              "linear-gradient(180deg, #00FF88, rgba(0,255,136,0.3), rgba(0,255,136,0.08))",
            animation: "shield-pulse 3s infinite",
          }}
        />

        {/* Body */}
        <div
          style={{
            position: "relative",
            clipPath: shieldClip,
            background:
              "linear-gradient(180deg, rgba(10,14,26,0.97) 0%, rgba(5,7,13,0.99) 100%)",
            padding: "44px 36px 50px",
            textAlign: "center",
            transform: open ? "scale(1)" : "scale(0.85)",
            transition: "transform 0.5s var(--easing)",
          }}
        >
          {/* Close */}
          <button
            className="data-hover"
            onClick={onClose}
            style={{
              position: "absolute",
              top: "28px",
              right: "50px",
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              fontSize: "1.3rem",
              zIndex: 10,
              cursor: "pointer",
            }}
          >
            ✕
          </button>

          {/* Logo */}
          <div
            style={{
              fontFamily: "'Teko', sans-serif",
              fontSize: "1.6rem",
              textTransform: "uppercase",
              letterSpacing: "3px",
              marginBottom: "2px",
            }}
          >
            Dream<span style={{ color: "var(--accent-neon)" }}>Team</span>
          </div>
          <div
            style={{
              fontSize: "0.7rem",
              textTransform: "uppercase",
              letterSpacing: "3px",
              color: "var(--text-secondary)",
              marginBottom: "1.5rem",
            }}
          >
            Enter The Arena
          </div>

          {/* Progress with sport icons */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.8rem",
            }}
          >
            {[1, 2, 3].map((n, i) => {
              const IconComponent = stepIcons[i];
              const isCompleted = step > n;
              const isActive = step === n;
              return (
                <div
                  key={n}
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      border: `2px solid ${
                        isCompleted || isActive
                          ? "var(--accent-neon)"
                          : "rgba(255,255,255,0.12)"
                      }`,
                      background: isCompleted
                        ? "var(--accent-neon)"
                        : "transparent",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      boxShadow: isActive
                        ? "0 0 16px rgba(0,255,136,0.35)"
                        : "none",
                      transition: "all 0.4s var(--easing)",
                      animation: isActive
                        ? "float 2s ease-in-out infinite"
                        : "none",
                    }}
                  >
                    <IconComponent
                      active={isActive}
                      completed={isCompleted}
                    />
                  </div>
                  {i < 2 && (
                    <div
                      style={{
                        width: "44px",
                        height: "2px",
                        background:
                          step > n
                            ? "var(--accent-neon)"
                            : "rgba(255,255,255,0.08)",
                        transition: "background 0.4s",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step 1: Wallet */}
          {step === 1 && (
            <div style={{ animation: "stepFade 0.5s var(--easing)" }}>
              <h2
                style={{
                  fontFamily: "'Teko', sans-serif",
                  fontSize: "2rem",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "0.4rem",
                }}
              >
                Connect Wallet
              </h2>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.9rem",
                  marginBottom: "1.5rem",
                  lineHeight: 1.5,
                  padding: "0 10px",
                }}
              >
                Link your Web3 wallet to verify ownership and unlock your arena
                credentials.
              </p>
              <button
                className="onboard-btn data-hover"
                onClick={() => completeStep(1)}
                disabled={connecting}
              >
                {connecting ? (
                  <span style={{ animation: "pulse-text 0.6s infinite" }}>
                    Connecting...
                  </span>
                ) : (
                  <>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="2" y="6" width="20" height="12" rx="2" />
                      <path d="M22 10h-6a2 2 0 0 0 0 4h6" />
                    </svg>
                    Connect Wallet
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 2: Twitter */}
          {step === 2 && (
            <div style={{ animation: "stepFade 0.5s var(--easing)" }}>
              <div
                className="inline-flex items-center gap-2 mb-4"
                style={{
                  color: "var(--accent-neon)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  fontSize: "0.8rem",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Wallet Connected
              </div>
              <h2
                style={{
                  fontFamily: "'Teko', sans-serif",
                  fontSize: "2rem",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "0.4rem",
                }}
              >
                Connect Twitter
              </h2>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.9rem",
                  marginBottom: "1.5rem",
                  lineHeight: 1.5,
                  padding: "0 10px",
                }}
              >
                Link your Twitter/X account to generate your unique referral
                identity and climb the queue.
              </p>
              <button
                className="onboard-btn twitter-btn data-hover"
                onClick={() => completeStep(2)}
                disabled={connecting}
              >
                {connecting ? (
                  <span style={{ animation: "pulse-text 0.6s infinite" }}>
                    Connecting...
                  </span>
                ) : (
                  <>
                    <XIcon />
                    Connect Twitter / X
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 3: Referral — ref link above description */}
          {step === 3 && (
            <div style={{ animation: "stepFade 0.5s var(--easing)" }}>
              <div
                className="inline-flex items-center gap-2"
                style={{
                  color: "var(--accent-neon)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  fontSize: "0.8rem",
                  marginBottom: "0.5rem",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Twitter Connected
              </div>
              <h2
                style={{
                  fontFamily: "'Teko', sans-serif",
                  fontSize: "2rem",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "0.5rem",
                }}
              >
                Share & Climb
              </h2>

              {/* Ref Link — sits above the description */}
              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  marginBottom: "0.5rem",
                }}
              >
                <input
                  ref={refInputRef}
                  type="text"
                  value={refLink}
                  readOnly
                  className="data-hover"
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "var(--accent-neon)",
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: "0.8rem",
                    outline: "none",
                    minWidth: 0,
                  }}
                />
                <button
                  className="data-hover"
                  onClick={copyRef}
                  style={{
                    padding: "10px 14px",
                    background: copied ? "#fff" : "var(--accent-neon)",
                    border: "none",
                    color: "var(--bg-deep)",
                    fontWeight: 700,
                    fontFamily: "'Rajdhani', sans-serif",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    fontSize: "0.8rem",
                    whiteSpace: "nowrap",
                    clipPath:
                      "polygon(0 0, 100% 0, 100% 70%, 85% 100%, 0 100%)",
                    transition: "all 0.3s",
                    cursor: "pointer",
                  }}
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>

              {/* Description — below ref link */}
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.85rem",
                  marginBottom: "0.6rem",
                  lineHeight: 1.4,
                  padding: "0 10px",
                }}
              >
                Share your referral link on Twitter. Each recruit moves you{" "}
                <span style={{ color: "var(--accent-neon)" }}>
                  50 positions
                </span>{" "}
                closer to early access.
              </p>

              <button
                className="share-twitter-btn data-hover"
                onClick={shareOnTwitter}
              >
                <XIcon />
                Share on Twitter
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
