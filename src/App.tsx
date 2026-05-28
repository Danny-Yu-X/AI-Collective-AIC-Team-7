import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { StockSymbol, TimeHorizon, StockParams, PredictionResult } from "./types";
import { STOCKS_DATA, runModelPredict } from "./utils/model";
import FrameOne from "./components/FrameOne";
import FrameTwo from "./components/FrameTwo";
import FrameThree from "./components/FrameThree";

export default function App() {
  const [frame, setFrame] = useState<1 | 2 | 3>(1);
  const [selectedStock, setSelectedStock] = useState<StockSymbol>("AMZN");
  const [selectedHorizon, setSelectedHorizon] = useState<TimeHorizon>("1 Day");
  
  // Set default parameters based on AMZN initially
  const [params, setParams] = useState<StockParams>({
    ...STOCKS_DATA.AMZN.defaultParams
  });

  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);

  // CSV metadata state
  const [realDate, setRealDate] = useState<string | undefined>(undefined);
  const [sentimentLabel, setSentimentLabel] = useState<string | undefined>(undefined);
  const [sentimentScore, setSentimentScore] = useState<number | undefined>(undefined);

  // Trigger loading screen
  const handleStartPredict = () => {
    setFrame(2);
  };

  // Compile predictions when loading completes
  const handleLoadingComplete = () => {
    const result = runModelPredict(selectedStock, selectedHorizon, params);
    setPredictionResult({
      ...result,
      realDate,
      sentimentLabel,
      sentimentScore,
    });
    setFrame(3);
  };

  const handleReset = () => {
    setFrame(1);
    setPredictionResult(null);
    // Keep the CSV state in case they want to run another prediction with different settings
  };

  return (
    <div className="min-h-screen bg-neutral-900/10 flex items-center justify-center p-4 sm:p-6 md:p-10 font-sans">
      
      {/* Visual Canvas Matching Screenshot Style (Thick Border, Corner Decorations) */}
      <div className="w-full max-w-4xl min-h-[580px] bg-[#fdfdfc] border-[10px] border-[#76d795] rounded-none shadow-2xl relative flex flex-col justify-between overflow-hidden">
        
        {/* Top-Right Decorative Corner L-bracket (lime green) */}
        <div className="absolute top-4 right-4 border-t-8 border-r-8 border-[#dafda7] w-14 h-14 pointer-events-none select-none z-0" />
        
        {/* Bottom-Left Decorative Corner L-bracket (lime green) */}
        <div className="absolute bottom-4 left-4 border-b-8 border-l-8 border-[#dafda7] w-14 h-14 pointer-events-none select-none z-0" />

        {/* Dynamic Frame Navigation with AnimatePresence */}
        <AnimatePresence mode="wait">
          {frame === 1 && (
            <motion.div
              key="frame1"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="flex-1 flex flex-col"
            >
              <FrameOne
                selectedStock={selectedStock}
                setSelectedStock={setSelectedStock}
                selectedHorizon={selectedHorizon}
                setSelectedHorizon={setSelectedHorizon}
                params={params}
                setParams={setParams}
                onPredict={handleStartPredict}
                realDate={realDate}
                setRealDate={setRealDate}
                sentimentLabel={sentimentLabel}
                setSentimentLabel={setSentimentLabel}
                sentimentScore={sentimentScore}
                setSentimentScore={setSentimentScore}
              />
            </motion.div>
          )}

          {frame === 2 && (
            <motion.div
              key="frame2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col justify-center"
            >
              <FrameTwo
                stockSymbol={selectedStock}
                onComplete={handleLoadingComplete}
              />
            </motion.div>
          )}

          {frame === 3 && predictionResult && (
            <motion.div
              key="frame3"
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="flex-1 flex flex-col"
            >
              <FrameThree
                result={predictionResult}
                onReset={handleReset}
              />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
