"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [velocity, setVelocity] = useState({ dx: 2, dy: 2 });

  // Bouncing smiley face logic
  useEffect(() => {
    const smileySize = 60;
    const interval = setInterval(() => {
      setPosition((prev) => {
        let { x, y } = prev;
        let { dx, dy } = velocity;

        x += dx;
        y += dy;

        // Bounce off edges
        if (x <= 0 || x >= window.innerWidth - smileySize) {
          dx = -dx;
        }
        if (y <= 0 || y >= window.innerHeight - smileySize) {
          dy = -dy;
        }

        setVelocity({ dx, dy });
        return { x, y };
      });
    }, 16);

    return () => clearInterval(interval);
  }, [velocity]);

  const handleGetStarted = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-pink-50 to-white overflow-hidden relative">
      {/* Bouncing Smiley Face */}
      <div
        className="absolute text-6xl transition-none pointer-events-none"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        😊
      </div>

      {/* Main Content */}
      <div className="min-h-screen flex flex-col items-center justify-center px-6 relative z-10">
        {/* Logo and Title */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 flex items-center justify-center">
            <img src="/TMoodBileLogo.svg" alt="T-MoodBile Logo" className="w-full h-full" />
          </div>
          <h1 className="font-extrabold text-6xl text-[#ED008C] tracking-wide">
            T-MoodBile
          </h1>
        </div>

        {/* Description */}
        <div className="max-w-2xl text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Customer Sentiment Analysis Platform
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed mb-4">
            Transform customer feedback into actionable insights with our real-time sentiment analysis dashboard.
          </p>
          <p className="text-base text-gray-600 leading-relaxed">
            T-MoodBile empowers your business to understand customer emotions through advanced sentiment tracking,
            comprehensive analytics, and intelligent insights. Monitor direct and indirect sentiment metrics,
            track trends over time, and make data-driven decisions to enhance customer satisfaction.
          </p>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleGetStarted}
          className="bg-[#ED008C] text-white font-bold text-lg rounded-xl px-12 py-4 shadow-xl hover:opacity-90 transition transform hover:scale-105"
        >
          Get Started
        </button>
        <p className="text-xs text-gray-500 mt-4">No sign-in required to explore the dashboard</p>
      </div>
    </div>
  );
}
