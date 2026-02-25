"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useSearchParams } from "next/navigation";

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
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke={completed ? "#0A0E1A" : active ? "#00FF88" : "#8892b0"}
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="6" r="2.5" fill={completed ? "#0A0E1A" : active ? "#00FF88" : "none"} />
    <line x1="4" y1="20" x2="14" y2="10" />
    <line x1="12" y1="12" x2="15" y2="15" />
    <line x1="3" y1="21" x2="5" y2="19" />
  </svg>
);

const FootballIcon = ({ active, completed }: { active: boolean; completed: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke={completed ? "#0A0E1A" : active ? "#00FF88" : "#8892b0"}
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2l3 7h-6l3-7z" />
    <path d="M2.5 9.5l6.5 2-2.5 6z" />
    <path d="M21.5 9.5l-6.5 2 2.5 6z" />
    <polygon points="12,8 15.5,11 14,15.5 10,15.5 8.5,11" />
  </svg>
);

const TrophyIcon = ({ active, completed }: { active: boolean; completed: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke={completed ? "#0A0E1A" : active ? "#00FF88" : "#8892b0"}
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

const stepIcons = [CricketIcon, FootballIcon, TrophyIcon];

function generateRefCode(handle: string): string {
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${handle}-${suffix}`;
}

// Normalize wallet address to lowercase for consistent DB lookups
function normalizeAddress(addr: string): string {
  return addr ? addr.toLowerCase() : "";
}

export default function OnboardingPopup({ open, onClose }: OnboardingPopupProps) {
  const [step, setStep] = useState(1);
  const [connecting, setConnecting] = useState(false);
  const [refLink, setRefLink] = useState("");
  const [queuePosition, setQueuePosition] = useState(0);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("");
  const refInputRef = useRef<HTMLInputElement>(null);

  const { ready, authenticated, user, login, linkTwitter } = usePrivy();
  const { wallets } = useWallets();
  const searchParams = useSearchParams();

  const getReferredBy = (): string => {
    if (typeof window === "undefined") return "";
    const url = new URL(window.location.href);
    return url.searchParams.get("ref") || "";
  };

  const saveToSupabase = useCallback(async (wallet: string, twitter?: string) => {
    try {
      const normalized = normalizeAddress(wallet);
      const walletRes = await fetch("/api/user/connect-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: normalized, referredBy: getReferredBy() }),
      });
      const walletData = await walletRes.json();

      if (walletData.user?.queue_position) {
        setQueuePosition(walletData.user.queue_position);
      }

      if (twitter) {
        const refCode = walletData.user?.ref_code || generateRefCode(twitter);
        const res = await fetch("/api/user/connect-twitter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walletAddress: normalized, twitterHandle: twitter, refCode }),
        });
        const data = await res.json();
        if (data.user) {
          setRefLink(`mydreamteam.xyz/join/${data.user.ref_code}`);
          setQueuePosition(data.user.queue_position || queuePosition);
          return data.user;
        }
      }

      if (walletData.user?.twitter_handle && walletData.user?.ref_code) {
        setRefLink(`mydreamteam.xyz/join/${walletData.user.ref_code}`);
        setTwitterHandle(walletData.user.twitter_handle);
        return walletData.user;
      }

      return walletData.user;
    } catch (err) {
      console.error("Supabase save error:", err);
      return null;
    }
  }, [queuePosition]);

  const checkExistingUser = useCallback(async (wallet: string) => {
    try {
      const normalized = normalizeAddress(wallet);
      const res = await fetch("/api/user/connect-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: normalized }),
      });
      const data = await res.json();
      return data.user;
    } catch {
      return null;
    }
  }, []);

  // Watch Privy auth state and advance steps
  useEffect(() => {
    if (!ready || !authenticated || !user) return;

    const wallet = wallets[0]?.address || user.wallet?.address;
    if (wallet && !walletAddress) {
      setWalletAddress(normalizeAddress(wallet));
    }

    const twitter = user.twitter?.username;
    if (twitter && !twitterHandle) {
      setTwitterHandle(twitter);
    }

    if (wallet && twitter && step < 3) {
      saveToSupabase(wallet, twitter).then((savedUser) => {
        if (savedUser?.ref_code) {
          setRefLink(`mydreamteam.xyz/join/${savedUser.ref_code}`);
        }
        setStep(3);
        setConnecting(false);
      });
    } else if (wallet && !twitter && step === 1) {
      // Check if this wallet already has Twitter linked in our DB
      checkExistingUser(wallet).then((existingUser) => {
        if (existingUser?.twitter_handle && existingUser?.ref_code) {
          // Already completed onboarding — skip straight to step 3
          setTwitterHandle(existingUser.twitter_handle);
          setRefLink(`mydreamteam.xyz/join/${existingUser.ref_code}`);
          setQueuePosition(existingUser.queue_position || 0);
          setStep(3);
        } else {
          saveToSupabase(wallet).then(() => {
            setStep(2);
          });
        }
        setConnecting(false);
      });
    }
  }, [ready, authenticated, user, wallets, step, walletAddress, twitterHandle, saveToSupabase, checkExistingUser]);

  const handleConnectWallet = async () => {
    setError("");
    setConnecting(true);
    try {
      login({ loginMethods: ["wallet"] });
    } catch (err) {
      console.error("Login error:", err);
      setError("Failed to connect wallet.");
      setConnecting(false);
    }
  };

  // *** THE KEY FIX: Check BEFORE calling linkTwitter() to prevent Privy error modal ***
  const handleConnectTwitter = async () => {
    setError("");
    setConnecting(true);

    // CHECK 1: Does Privy already have Twitter on this user?
    if (user?.twitter?.username) {
      console.log("Twitter already linked in Privy:", user.twitter.username);
      const twitter = user.twitter.username;
      setTwitterHandle(twitter);
      const savedUser = await saveToSupabase(walletAddress, twitter);
      if (savedUser?.ref_code) {
        setRefLink(`mydreamteam.xyz/join/${savedUser.ref_code}`);
        setQueuePosition(savedUser.queue_position || 0);
      }
      setStep(3);
      setConnecting(false);
      return;
    }

    // CHECK 2: Does our DB already have this wallet with Twitter?
    if (walletAddress) {
      console.log("Checking DB for existing user with wallet:", walletAddress);
      const existingUser = await checkExistingUser(walletAddress);
      console.log("DB check result:", existingUser);
      if (existingUser?.twitter_handle && existingUser?.ref_code) {
        console.log("Found existing user with Twitter, skipping to step 3");
        setTwitterHandle(existingUser.twitter_handle);
        setRefLink(`mydreamteam.xyz/join/${existingUser.ref_code}`);
        setQueuePosition(existingUser.queue_position || 0);
        setStep(3);
        setConnecting(false);
        return;
      }
    }

    // CHECK 3: Only NOW call linkTwitter() — user genuinely hasn't linked yet
    console.log("No existing Twitter found, calling linkTwitter()");
    try {
      await linkTwitter();
    } catch (err: any) {
      console.error("Twitter link error:", err);
      // After error, re-check in case it partially worked
      if (user?.twitter?.username) {
        const twitter = user.twitter.username;
        setTwitterHandle(twitter);
        const savedUser = await saveToSupabase(walletAddress, twitter);
        if (savedUser?.ref_code) {
          setRefLink(`mydreamteam.xyz/join/${savedUser.ref_code}`);
          setQueuePosition(savedUser.queue_position || 0);
        }
        setStep(3);
        setConnecting(false);
        return;
      }
      setError("Failed to connect Twitter. Please try again.");
      setConnecting(false);
    }
  };

  const copyRef = () => {
    if (refInputRef.current) {
      refInputRef.current.select();
      navigator.clipboard.writeText(refInputRef.current.value).catch(() => {
        document.execCommand("copy");
      });
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnTwitter = () => {
    const text = encodeURIComponent(
      `I just secured my spot in the DreamTeam fantasy arena \u{1F3CF}\u{26BD}\u{1F6E1}\n\nJoin with my link and we both climb the leaderboard:\nhttps://${refLink}\n\n#DreamTeam #FantasySports #Web3`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains("onboarding-overlay") ||
      (e.target as HTMLElement).closest(".onboarding-bg")) {
      onClose();
    }
  };

  const shieldClip = "polygon(50% 0%, 98% 6%, 100% 52%, 82% 80%, 50% 100%, 18% 80%, 0% 52%, 2% 6%)";

  return (
    <div className="onboarding-overlay" style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      zIndex: 50000, display: "flex", justifyContent: "center", alignItems: "center",
      opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none",
      transition: "opacity 0.5s var(--easing)",
    }} onClick={handleOverlayClick}>
      <div className="onboarding-bg" style={{
        position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
        display: "grid", gridTemplateColumns: "1fr 1fr", zIndex: 0,
      }}>
        <div style={{ position: "relative", overflow: "hidden" }}>
          <video autoPlay muted loop playsInline style={{
            width: "100%", height: "100%", objectFit: "cover",
            filter: "brightness(0.15) contrast(1.3) saturate(0.6)",
          }}>
            <source src="https://cdn.coverr.co/videos/coverr-cricket-player-hitting-a-ball-5765/1080p.mp4" type="video/mp4" />
          </video>
        </div>
        <div style={{ position: "relative", overflow: "hidden" }}>
          <video autoPlay muted loop playsInline style={{
            width: "100%", height: "100%", objectFit: "cover",
            filter: "brightness(0.15) contrast(1.3) saturate(0.6)",
          }}>
            <source src="https://cdn.coverr.co/videos/coverr-soccer-ball-kick-close-up-4910/1080p.mp4" type="video/mp4" />
          </video>
        </div>
        <div style={{
          position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(5, 7, 13, 0.85)", backdropFilter: "blur(8px)",
        }} />
      </div>

      <div style={{ position: "relative", zIndex: 2, width: "460px", maxWidth: "92vw" }}>
        <div style={{
          position: "absolute", top: "-2px", left: "-2px",
          width: "calc(100% + 4px)", height: "calc(100% + 4px)",
          clipPath: shieldClip,
          background: "linear-gradient(180deg, #00FF88, rgba(0,255,136,0.3), rgba(0,255,136,0.08))",
          animation: "shield-pulse 3s infinite",
        }} />
        <div style={{
          position: "relative", clipPath: shieldClip,
          background: "linear-gradient(180deg, rgba(10,14,26,0.97) 0%, rgba(5,7,13,0.99) 100%)",
          padding: "44px 36px 50px", textAlign: "center",
          transform: open ? "scale(1)" : "scale(0.85)",
          transition: "transform 0.5s var(--easing)",
        }}>
          <button className="data-hover" onClick={onClose} style={{
            position: "absolute", top: "28px", right: "50px",
            background: "none", border: "none", color: "var(--text-secondary)",
            fontSize: "1.3rem", zIndex: 10, cursor: "pointer",
          }}>&#x2715;</button>

          <div style={{
            fontFamily: "'Teko', sans-serif", fontSize: "1.6rem",
            textTransform: "uppercase", letterSpacing: "3px", marginBottom: "2px",
          }}>
            Dream<span style={{ color: "var(--accent-neon)" }}>Team</span>
          </div>
          <div style={{
            fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "3px",
            color: "var(--text-secondary)", marginBottom: "1.5rem",
          }}>Enter The Arena</div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.8rem" }}>
            {[1, 2, 3].map((n, i) => {
              const IconComponent = stepIcons[i];
              const isCompleted = step > n;
              const isActive = step === n;
              return (
                <div key={n} style={{ display: "flex", alignItems: "center" }}>
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "50%",
                    border: `2px solid ${isCompleted || isActive ? "var(--accent-neon)" : "rgba(255,255,255,0.12)"}`,
                    background: isCompleted ? "var(--accent-neon)" : "transparent",
                    display: "flex", justifyContent: "center", alignItems: "center",
                    boxShadow: isActive ? "0 0 16px rgba(0,255,136,0.35)" : "none",
                    transition: "all 0.4s var(--easing)",
                    animation: isActive ? "float 2s ease-in-out infinite" : "none",
                  }}>
                    <IconComponent active={isActive} completed={isCompleted} />
                  </div>
                  {i < 2 && <div style={{
                    width: "44px", height: "2px",
                    background: step > n ? "var(--accent-neon)" : "rgba(255,255,255,0.08)",
                    transition: "background 0.4s",
                  }} />}
                </div>
              );
            })}
          </div>

          {error && <p style={{ color: "#FF4444", fontSize: "0.8rem", marginBottom: "0.5rem" }}>{error}</p>}

          {step === 1 && (
            <div style={{ animation: "stepFade 0.5s var(--easing)" }}>
              <h2 style={{
                fontFamily: "'Teko', sans-serif", fontSize: "2rem",
                textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.4rem",
              }}>Connect Wallet</h2>
              <p style={{
                color: "var(--text-secondary)", fontSize: "0.9rem",
                marginBottom: "1.5rem", lineHeight: 1.5, padding: "0 10px",
              }}>
                Link your Web3 wallet to verify ownership and unlock your arena credentials.
              </p>
              <button className="onboard-btn data-hover" onClick={handleConnectWallet} disabled={connecting || !ready}>
                {connecting ? (
                  <span style={{ animation: "pulse-text 0.6s infinite" }}>Connecting...</span>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="6" width="20" height="12" rx="2" />
                      <path d="M22 10h-6a2 2 0 0 0 0 4h6" />
                    </svg>
                    Connect Wallet
                  </>
                )}
              </button>
            </div>
          )}

          {step === 2 && (
            <div style={{ animation: "stepFade 0.5s var(--easing)" }}>
              <div style={{
                color: "var(--accent-neon)", fontWeight: 600, textTransform: "uppercase",
                letterSpacing: "1px", fontSize: "0.8rem", marginBottom: "1rem",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Wallet Connected
                <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginLeft: "4px" }}>
                  ({walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)})
                </span>
              </div>
              <h2 style={{
                fontFamily: "'Teko', sans-serif", fontSize: "2rem",
                textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.4rem",
              }}>Connect Twitter</h2>
              <p style={{
                color: "var(--text-secondary)", fontSize: "0.9rem",
                marginBottom: "1.5rem", lineHeight: 1.5, padding: "0 10px",
              }}>
                Link your Twitter/X account to generate your unique referral identity and climb the queue.
              </p>
              <button className="onboard-btn twitter-btn data-hover" onClick={handleConnectTwitter}
                disabled={connecting}>
                {connecting ? (
                  <span style={{ animation: "pulse-text 0.6s infinite" }}>Connecting Twitter...</span>
                ) : (
                  <><XIcon /> Connect Twitter / X</>
                )}
              </button>
            </div>
          )}

          {step === 3 && (
            <div style={{ animation: "stepFade 0.5s var(--easing)" }}>
              <div style={{
                color: "var(--accent-neon)", fontWeight: 600, textTransform: "uppercase",
                letterSpacing: "1px", fontSize: "0.8rem", marginBottom: "0.5rem",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Twitter Connected {twitterHandle && <span style={{ color: "var(--text-secondary)" }}>@{twitterHandle}</span>}
              </div>
              <h2 style={{
                fontFamily: "'Teko', sans-serif", fontSize: "2rem",
                textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.5rem",
              }}>Share &amp; Climb</h2>

              <div style={{ display: "flex", gap: "6px", marginBottom: "0.5rem" }}>
                <input ref={refInputRef} type="text" value={refLink} readOnly className="data-hover" style={{
                  flex: 1, padding: "10px 12px", background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)", color: "var(--accent-neon)",
                  fontFamily: "'Rajdhani', sans-serif", fontSize: "0.8rem", outline: "none", minWidth: 0,
                }} />
                <button className="data-hover" onClick={copyRef} style={{
                  padding: "10px 14px", background: copied ? "#fff" : "var(--accent-neon)",
                  border: "none", color: "var(--bg-deep)", fontWeight: 700,
                  fontFamily: "'Rajdhani', sans-serif", textTransform: "uppercase",
                  letterSpacing: "1px", fontSize: "0.8rem", whiteSpace: "nowrap",
                  clipPath: "polygon(0 0, 100% 0, 100% 70%, 85% 100%, 0 100%)",
                  transition: "all 0.3s", cursor: "pointer",
                }}>
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>

              <p style={{
                color: "var(--text-secondary)", fontSize: "0.85rem",
                marginBottom: "0.6rem", lineHeight: 1.4, padding: "0 10px",
              }}>
                Share your referral link on Twitter. Each recruit moves you{" "}
                <span style={{ color: "var(--accent-neon)" }}>50 positions</span> closer to early access.
                {queuePosition > 0 && (
                  <span style={{ display: "block", marginTop: "4px" }}>
                    Your current position: <span style={{ color: "var(--accent-neon)" }}>#{queuePosition.toLocaleString()}</span>
                  </span>
                )}
              </p>

              <button className="share-twitter-btn data-hover" onClick={shareOnTwitter}>
                <XIcon /> Share on Twitter
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
