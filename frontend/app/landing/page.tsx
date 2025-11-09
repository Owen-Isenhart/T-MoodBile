"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const FACES = [
  { emoji: "😊", color: '', initial: { x: 100, y: 100, dx: 2, dy: 2 } },
  { emoji: "😠", color: '', initial: { x: 400, y: 300, dx: -2.2, dy: 2.4 } },
  { emoji: "😐", color: '', initial: { x: 250, y: 200, dx: 2.8, dy: 1.7 } }, // changed from y:500 and dy:-2 to y:200, positive dx and dy
];

export default function LandingPage() {
  const router = useRouter();
  const faceSize = 60;
  // Each face gets position and velocity state
  const [faces, setFaces] = useState(() => FACES.map(f => ({ ...f.initial })));

  // --- Name input ---
  const [userName, setUserName] = useState('');
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState('');

  // Bouncing and collision logic
  useEffect(() => {
    const interval = setInterval(() => {
      setFaces(prevFaces => {
        // Move faces
        let moved = prevFaces.map(({x, y, dx, dy}, i) => {
          let nx = x + dx;
          let ny = y + dy;
          // Bounce off edges
          if (nx <= 0 || nx >= window.innerWidth - faceSize) dx = -dx;
          if (ny <= 0 || ny >= window.innerHeight - faceSize) dy = -dy;
          return {x: nx, y: ny, dx, dy};
        });
        // Collision detection: if any pair overlap, swap horizontal and/or vertical direction
        for (let i=0; i < moved.length; ++i) {
          for (let j=i+1; j<moved.length; ++j) {
            const a = moved[i], b = moved[j];
            const distX = Math.abs((a.x + faceSize/2) - (b.x + faceSize/2));
            const distY = Math.abs((a.y + faceSize/2) - (b.y + faceSize/2));
            if (distX < faceSize && distY < faceSize) {
              // Simple: swap both dx and dy
              moved[i].dx = -moved[i].dx;
              moved[i].dy = -moved[i].dy;
              moved[j].dx = -moved[j].dx;
              moved[j].dy = -moved[j].dy;
            }
          }
        }
        return moved;
      });
    }, 16);
    return () => clearInterval(interval);
  }, []);

  const handleGetStarted = () => {
    if (!userName.trim()) {
      setTouched(true);
      setError('Please enter your name to continue.');
      return;
    }
    localStorage.setItem('tmoodbile_user_name', userName.trim());
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-pink-50 to-white overflow-hidden relative">
      {/* Animated Faces */}
      {faces.map((pos, idx) => (
        <div
          key={FACES[idx].emoji}
          className="absolute text-6xl transition-none pointer-events-none select-none"
          style={{
            left: `${pos.x}px`,
            top: `${pos.y}px`,
            // Optionally: background: FACES[idx].color?
          }}
        >
          {FACES[idx].emoji}
        </div>
      ))}
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
        </div>
        {/* Name Input */}
        <form onSubmit={e => { e.preventDefault(); handleGetStarted(); }} className="flex flex-col items-center w-full max-w-xs mb-7">
          <input
            type="text"
            className={`w-full px-4 py-2 border ${error ? 'border-red-400' : 'border-pink-300'} rounded text-lg focus:border-[#ED008C] outline-none mb-2`}
            placeholder="Enter your name"
            value={userName}
            onChange={e => { setUserName(e.target.value); setError(''); }}
            onBlur={() => { setTouched(true); if (!userName.trim()) setError('Please enter your name to continue.'); }}
            autoFocus
          />
          {error && touched && (
            <span className="text-red-500 text-sm mb-1">{error}</span>
          )}
          <button
            type="submit"
            disabled={!userName.trim()}
            className={`bg-[#ED008C] text-white font-bold text-lg rounded-xl px-12 py-4 shadow-xl hover:opacity-90 transition transform hover:scale-105 w-full mt-2${!userName.trim() ? ' opacity-60 cursor-not-allowed' : ''}`}
          >
            Get Started
          </button>
        </form>
      </div>
    </div>
  );
}
