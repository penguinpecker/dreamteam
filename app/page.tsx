"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import CustomCursor from "./components/CustomCursor";
import Loader from "./components/Loader";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import StatsBar from "./components/StatsBar";
import HowItWorks from "./components/HowItWorks";
import Showcase from "./components/Showcase";
import FinalCTA from "./components/FinalCTA";
import Footer from "./components/Footer";
import OnboardingPopup from "./components/OnboardingPopup";
import ScrollReveal from "./components/ScrollReveal";
import { usePrivy } from "@privy-io/react-auth";

function HomeContent() {
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const searchParams = useSearchParams();
  const { ready, authenticated, user } = usePrivy();

  // Auto-open popup on Twitter callback redirect
  useEffect(() => {
    const onboarding = searchParams.get("onboarding");
    if (onboarding === "step3") {
      setOnboardingOpen(true);
      document.body.style.overflow = "hidden";
    }
  }, [searchParams]);

  const openOnboarding = () => {
    setOnboardingOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeOnboarding = () => {
    setOnboardingOpen(false);
    document.body.style.overflow = "";
  };

  return (
    <>
      <CustomCursor />
      <Loader />
      <ScrollReveal />
      <div className="noise-overlay" />

      {/* Floating Shards */}
      <div
        className="shard"
        style={{
          top: "15%",
          left: "5%",
          width: "2px",
          height: "120px",
          transform: "rotate(35deg)",
        }}
      />
      <div
        className="shard"
        style={{
          bottom: "25%",
          right: "8%",
          width: "3px",
          height: "80px",
          transform: "rotate(-20deg)",
          animationDelay: "3s",
        }}
      />
      <div
        className="shard"
        style={{
          top: "60%",
          left: "45%",
          width: "100px",
          height: "2px",
          transform: "rotate(10deg)",
          animationDelay: "5s",
        }}
      />

      <Navbar onOpenOnboarding={openOnboarding} />
      <Hero onOpenOnboarding={openOnboarding} />
      <StatsBar />
      <HowItWorks />
      <Showcase />
      <FinalCTA onOpenOnboarding={openOnboarding} />
      <Footer />

      <OnboardingPopup open={onboardingOpen} onClose={closeOnboarding} />
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
