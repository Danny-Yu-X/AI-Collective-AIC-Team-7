import React from "react";
import { ArrowLeft, RefreshCw, TrendingUp, TrendingDown, Target, ChevronRight } from "lucide-react";
import { PredictionResult } from "../types";

interface FrameThreeProps {
  result: PredictionResult;
  onReset: () => void;
}

export default function FrameThree({ result, onReset }: FrameThreeProps) {
  const { symbol, timeHorizon, prediction, confidence, features, params, realDate, sentimentLabel, sentimentScore } = result;

  const isUp = prediction === "UP";

  // Coordinates for the interactive graph line (illustrative)
  // Matching screenshot 3: starting low, peak up, drop slightly, rocket to top right.
  const upLinePoints = "15,220 50,140 85,170 120,130 155,80 190,20";
  // Opposing trend if DOWN: starting high, dip down, rise slightly, drop to bottom right.
  const downLinePoints = "15,20 50,110 85,85 120,140 155,175 190,225";

  // Build grid lines coordinates (5x6 grids or similar inside a 200x240 box)
  const gridRows = Array.from({ length: 6 }, (_, i) => (i + 1) * 35);
  const gridCols = Array.from({ length: 5 }, (_, i) => (i + 1) * 35);
  return (
    <div className="flex-grow flex flex-col justify-between py-5 px-4 sm:px-8 relative z-10 select-none">
      
      {/* Top section: badge & info */}
      <div className="flex items-center justify-between w-full border-b border-emerald-100/30 pb-3">
        <div className="flex items-center gap-3">
          <div className="bg-[#a3f0b8] text-emerald-950 font-bold px-5 py-2 rounded-xl text-lg font-mono shadow-sm border border-emerald-300/30">
            {symbol}
          </div>
          <div className="flex flex-col text-xs font-mono text-emerald-800">
            <span>Horizon: {timeHorizon} Range {realDate ? `• Date: ${realDate}` : ''}</span>
            <span className="text-gray-400">Model accuracy: ~82.4%</span>
          </div>
        </div>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs text-emerald-800 hover:text-emerald-950 hover:bg-emerald-50 bg-white border border-emerald-100/60 px-3 py-1.5 rounded-lg transition font-semibold cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset Search
        </button>
      </div>

      {/* Center Layout: Left (Metrics) vs Right (Graph) */}
      <div className="my-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-center w-full max-w-4xl mx-auto py-4">
        
        {/* Left Column: Predictions & Details */}
        <div className="md:col-span-6 flex flex-col gap-6 font-sans">
          
          {/* Prediction Metric */}
          <div className="bg-emerald-50/10 p-4 rounded-xl border border-dashed border-emerald-200/30">
            <h3 className="text-xs font-mono text-gray-400 uppercase tracking-widest">
              Prediction:
            </h3>
            <div className="flex items-center gap-2 mt-1">
              {isUp ? (
                <TrendingUp className="w-8 h-8 text-emerald-600 animate-bounce" />
              ) : (
                <TrendingDown className="w-8 h-8 text-rose-500 animate-bounce" />
              )}
              <span className={`text-4xl sm:text-5xl font-black tracking-tight ${isUp ? "text-emerald-700" : "text-rose-600"}`}>
                {prediction}
              </span>
            </div>
          </div>

          {/* Confidence Metric */}
          <div className="bg-emerald-50/10 p-4 rounded-xl border border-dashed border-emerald-200/30">
            <h3 className="text-xs font-mono text-gray-400 uppercase tracking-widest">
              Confidence:
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-4xl sm:text-5xl font-black text-gray-800 tracking-tight">
                {confidence}%
              </span>
              <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden mt-3 ml-2">
                <div 
                  className={`h-full rounded-full ${isUp ? "bg-emerald-500" : "bg-rose-500"}`}
                  style={{ width: `${confidence}%` }}
                />
              </div>
            </div>
          </div>

          {/* Real Sentiment Metric (if loaded from CSV) */}
          {realDate && sentimentLabel && (
            <div className="bg-emerald-50/10 p-4 rounded-xl border border-dashed border-[#76d795]/50 animate-fadeIn">
              <h3 className="text-xs font-mono text-emerald-800 uppercase tracking-widest font-bold">
                Historical Sentiment Index:
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xl sm:text-2xl font-black tracking-tight uppercase ${
                  sentimentLabel.toLowerCase() === 'positive' 
                    ? 'text-emerald-700' 
                    : sentimentLabel.toLowerCase() === 'negative'
                      ? 'text-rose-600'
                      : 'text-gray-700'
                }`}>
                  {sentimentLabel}
                </span>
                {sentimentScore !== undefined && (
                  <span className="text-[10px] font-mono text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200/80">
                    Confidence: {(sentimentScore * 100).toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="text-[9px] text-gray-400 mt-1.5 font-mono">
                Date: {realDate} (Loaded from CSV)
              </p>
            </div>
          )}

          {/* Try Another Stock Button */}
          <button
            id="try-another-btn"
            onClick={onReset}
            className="flex items-center justify-center gap-2 bg-[#a3f0b8] hover:bg-[#92e4a8] text-emerald-950 font-bold px-6 py-3 rounded-xl shadow-md border-b-2 border-emerald-600 active:border-b-0 hover:translate-y-0.5 transition cursor-pointer text-sm sm:text-base w-full sm:w-56"
          >
            <ArrowLeft className="w-4 h-4" />
            Try Another Stock
          </button>
        </div>

        {/* Right Column: Visualizer Trend Graph (Matching screenshot 3 details) */}
        <div className="md:col-span-6 flex justify-center items-center w-full">
          <div className="w-full max-w-[340px] aspect-square bg-[#76d795]/20 p-3 rounded-2xl border-4 border-[#76d795] shadow-lg flex items-center justify-center relative bg-white">
            
            {/* SVG Plot view */}
            <svg 
              viewBox="0 0 200 240" 
              className="w-full h-full bg-white select-none relative"
              id="illustrative-trend-svg"
            >
              {/* Backgrid Lines */}
              {gridRows.map((yVal, index) => (
                <line
                  key={`row-${index}`}
                  x1="0"
                  y1={yVal}
                  x2="200"
                  y2={yVal}
                  stroke="#e2e8f0"
                  strokeWidth="0.75"
                />
              ))}
              {gridCols.map((xVal, index) => (
                <line
                  key={`col-${index}`}
                  x1={xVal}
                  y1="0"
                  x2={xVal}
                  y2="240"
                  stroke="#e2e8f0"
                  strokeWidth="0.75"
                />
              ))}

              {/* Bold trend line */}
              <polyline
                fill="none"
                stroke="#e11d48" // Thick Red Line
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={isUp ? upLinePoints : downLinePoints}
                className="transition-all duration-1000"
              />

              {/* Glowing trend caps */}
              <circle
                cx={isUp ? 190 : 190}
                cy={isUp ? 20 : 225}
                r="6"
                fill="#be123c"
                className="animate-pulse"
              />
            </svg>
            
            {/* Overlay Graph Metadata */}
            <div className="absolute top-5 right-5 font-mono text-[9px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 uppercase tracking-widest pointer-events-none">
              {isUp ? "UPWARD TREND" : "DOWNWARD TREND"}
            </div>
            
            <div className="absolute bottom-5 left-5 font-mono text-[9px] text-gray-400 uppercase tracking-widest pointer-events-none">
              GRID: INTERPOLATED
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
