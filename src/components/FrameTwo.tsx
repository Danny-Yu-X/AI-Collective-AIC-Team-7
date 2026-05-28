import React, { useState, useEffect } from "react";

interface FrameTwoProps {
  onComplete: () => void;
  stockSymbol: string;
}

export default function FrameTwo({ onComplete, stockSymbol }: FrameTwoProps) {
  const [loadingText, setLoadingText] = useState("Initializing model matrices...");

  useEffect(() => {
    // Stage updates for simulated model analysis to offer dynamic, professional response
    const timers = [
      setTimeout(() => setLoadingText(`Extracting ${stockSymbol} OHLCV dimensions...`), 400),
      setTimeout(() => setLoadingText("Engineering features: close_position & shadow_ratio..."), 900),
      setTimeout(() => setLoadingText("Evaluating 100+ decision trees in parallel..."), 1300),
      setTimeout(() => setLoadingText("Compiling probability distributions..."), 1700),
      setTimeout(() => onComplete(), 2000), // Complete transition after 2 seconds
    ];

    return () => {
      timers.forEach(t => clearTimeout(t));
    };
  }, [onComplete, stockSymbol]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10 select-none">
      <div className="flex flex-col items-center justify-center gap-8 max-w-md w-full text-center">
        {/* Loading text header */}
        <div className="flex flex-col gap-1.5 animate-pulse">
          <h2 className="text-xl sm:text-2xl font-bold text-emerald-950 font-sans tracking-tight">
            Analyzing stock data...
          </h2>
          <p className="text-xs sm:text-sm text-emerald-700/80 font-mono h-4">
            {loadingText}
          </p>
        </div>

        {/* Elegant circular progress loader */}
        <div className="relative w-24 h-24">
          {/* Static gray backing track */}
          <div className="absolute inset-0 rounded-full border-8 border-gray-200" />
          {/* Animated green spinning stroke */}
          <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-emerald-500 border-r-emerald-500 animate-spin" />
        </div>

        {/* Technical subtitle footer */}
        <div className="bg-emerald-50/40 border border-emerald-100/50 p-2.5 rounded-lg text-[10px] text-emerald-800/80 font-mono">
          MODEL: XGBoost Classifier (RandomState=42)
        </div>
      </div>
    </div>
  );
}
