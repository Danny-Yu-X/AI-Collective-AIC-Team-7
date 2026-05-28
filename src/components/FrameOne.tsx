import React, { useState, useRef, useEffect } from "react";
import { 
  ChevronDown, 
  BarChart3, 
  Sliders, 
  Info, 
  Cpu, 
  Upload, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Sparkles,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { StockSymbol, TimeHorizon, StockParams } from "../types";
import { STOCKS_DATA, computeFeatures } from "../utils/model";

interface CSVStockRecord {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  company: string;
  sentiment?: string;
  sentimentScore?: number;
}

interface FrameOneProps {
  selectedStock: StockSymbol;
  setSelectedStock: (stock: StockSymbol) => void;
  selectedHorizon: TimeHorizon;
  setSelectedHorizon: (horizon: TimeHorizon) => void;
  params: StockParams;
  setParams: (p: StockParams) => void;
  onPredict: () => void;
  realDate?: string;
  setRealDate: (d?: string) => void;
  sentimentLabel?: string;
  setSentimentLabel: (s?: string) => void;
  sentimentScore?: number;
  setSentimentScore: (v?: number) => void;
}

function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let col = "";
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        col += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(col.trim());
      col = "";
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(col.trim());
      if (row.length > 1 || row[0] !== "") {
        lines.push(row);
      }
      row = [];
      col = "";
    } else {
      col += char;
    }
  }
  if (col !== "" || row.length > 0) {
    row.push(col.trim());
    lines.push(row);
  }
  return lines;
}

export default function FrameOne({
  selectedStock,
  setSelectedStock,
  selectedHorizon,
  setSelectedHorizon,
  params,
  setParams,
  onPredict,
  realDate,
  setRealDate,
  sentimentLabel,
  setSentimentLabel,
  sentimentScore,
  setSentimentScore,
}: FrameOneProps) {
  const [stockOpen, setStockOpen] = useState(false);
  const [horizonOpen, setHorizonOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // CSV uploader state
  const [csvRecords, setCsvRecords] = useState<CSVStockRecord[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [selectedCsvIndex, setSelectedCsvIndex] = useState<number | null>(null);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

  const stockRef = useRef<HTMLDivElement>(null);
  const horizonRef = useRef<HTMLDivElement>(null);
  const dateDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns if user clicks outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (stockRef.current && !stockRef.current.contains(event.target as Node)) {
        setStockOpen(false);
      }
      if (horizonRef.current && !horizonRef.current.contains(event.target as Node)) {
        setHorizonOpen(false);
      }
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
        setDateDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filterRecordsForStock = (records: CSVStockRecord[], stock: StockSymbol) => {
    return records.filter(r => {
      const comp = r.company.toLowerCase();
      if (stock === "AMZN") return comp.includes("amazon") || comp === "amzn";
      if (stock === "AAPL") return comp.includes("apple") || comp === "aapl";
      if (stock === "TSLA") return comp.includes("tesla") || comp === "tsla";
      return true;
    });
  };

  const selectRecord = (rec: CSVStockRecord, globalIdx: number) => {
    setSelectedCsvIndex(globalIdx);
    setParams({
      Open: rec.open,
      High: rec.high,
      Low: rec.low,
      Close: rec.close,
      Volume: rec.volume
    });
    setRealDate(rec.date);
    setSentimentLabel(rec.sentiment);
    setSentimentScore(rec.sentimentScore);
  };

  // Sync CSV date selection when stock changes
  useEffect(() => {
    if (csvRecords.length > 0) {
      const filtered = filterRecordsForStock(csvRecords, selectedStock);
      if (filtered.length > 0) {
        const globalIdx = csvRecords.indexOf(filtered[0]);
        selectRecord(filtered[0], globalIdx);
      } else {
        setSelectedCsvIndex(null);
        setRealDate(undefined);
        setSentimentLabel(undefined);
        setSentimentScore(undefined);
      }
    }
  }, [selectedStock, csvRecords]);

  // Update default parameters when stock selection changes
  const handleStockSelect = (sym: StockSymbol) => {
    setSelectedStock(sym);
    if (csvRecords.length === 0) {
      setParams({ ...STOCKS_DATA[sym].defaultParams });
      setRealDate(undefined);
      setSentimentLabel(undefined);
      setSentimentScore(undefined);
    }
    setStockOpen(false);
  };

  const handleHorizonSelect = (hor: TimeHorizon) => {
    setSelectedHorizon(hor);
    setHorizonOpen(false);
  };

  // CSV parsing logic
  const processCsvFile = (text: string) => {
    try {
      setCsvError(null);
      const rows = parseCSV(text);
      if (rows.length < 2) {
        throw new Error("The CSV file is empty or missing headers.");
      }

      const headers = rows[0].map(h => h.trim().replace(/^"|"$/g, ''));
      
      const findHeaderIdx = (names: string[]) => {
        for (const name of names) {
          const idx = headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()));
          if (idx !== -1) return idx;
        }
        return -1;
      };

      const openIdx = findHeaderIdx(['open']);
      const highIdx = findHeaderIdx(['high']);
      const lowIdx = findHeaderIdx(['low']);
      const closeIdx = findHeaderIdx(['close']);
      const volumeIdx = findHeaderIdx(['volume']);
      const companyIdx = findHeaderIdx(['company', 'symbol', 'ticker']);
      const dateIdx = findHeaderIdx(['date', 'time']);
      const sentimentIdx = findHeaderIdx(['sentiment']);
      const sentimentScoreIdx = findHeaderIdx(['sentiment_score', 'score']);

      if (openIdx === -1 || highIdx === -1 || lowIdx === -1 || closeIdx === -1) {
        throw new Error("Missing required stock columns: Open, High, Low, Close.");
      }

      const parsedRecords: CSVStockRecord[] = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 4) continue;

        const openVal = parseFloat(row[openIdx]);
        const highVal = parseFloat(row[highIdx]);
        const lowVal = parseFloat(row[lowIdx]);
        const closeVal = parseFloat(row[closeIdx]);
        const volumeVal = volumeIdx !== -1 ? parseInt(row[volumeIdx]) : 1000000;
        const companyVal = companyIdx !== -1 ? row[companyIdx].trim() : "";
        const dateVal = dateIdx !== -1 ? row[dateIdx].trim() : "";
        const sentimentVal = sentimentIdx !== -1 ? row[sentimentIdx].trim() : "";
        const sentimentScoreVal = (sentimentScoreIdx !== -1 && row[sentimentScoreIdx]) 
          ? parseFloat(row[sentimentScoreIdx]) 
          : undefined;

        if (isNaN(openVal) || isNaN(highVal) || isNaN(lowVal) || isNaN(closeVal)) {
          continue;
        }

        parsedRecords.push({
          date: dateVal || `Record #${i}`,
          open: openVal,
          high: highVal,
          low: lowVal,
          close: closeVal,
          volume: isNaN(volumeVal) ? 1000000 : volumeVal,
          company: companyVal,
          sentiment: sentimentVal,
          sentimentScore: isNaN(sentimentScoreVal as number) ? undefined : sentimentScoreVal,
        });
      }

      if (parsedRecords.length === 0) {
        throw new Error("No valid stock price rows found in the CSV.");
      }

      setCsvRecords(parsedRecords);
    } catch (err: any) {
      setCsvError(err.message || "Failed to parse CSV file.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      processCsvFile(text);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      processCsvFile(text);
    };
    reader.readAsText(file);
  };

  const clearCsv = () => {
    setCsvRecords([]);
    setRealDate(undefined);
    setSentimentLabel(undefined);
    setSentimentScore(undefined);
    setSelectedCsvIndex(null);
    setParams({ ...STOCKS_DATA[selectedStock].defaultParams });
  };

  // Helper to handle parameter modifications
  const updateParam = (key: keyof StockParams, val: number) => {
    const updated = { ...params, [key]: val };
    
    // Ensure High is always at least as high as Low, Open, and Close
    if (key === "High") {
      updated.High = Math.max(val, updated.Low, updated.Open, updated.Close);
    } else if (key === "Low") {
      updated.Low = Math.min(val, updated.High, updated.Open, updated.Close);
    } else if (key === "Open" || key === "Close") {
      updated.High = Math.max(updated.High, val);
      updated.Low = Math.min(updated.Low, val);
    }

    setParams(updated);
  };

  // Compute live engineered features for live indicators
  const engineered = computeFeatures(params);

  return (
    <div className="flex-1 flex flex-col justify-between py-6 px-4 sm:px-8 relative z-10 select-none">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight font-sans">
            Stock Trend Predictor
          </h1>
          <p className="text-xs text-gray-500 font-mono mt-0.5">
            XGBoost Ensemble Engine v1.4.2
          </p>
        </div>
        
        {/* Toggle to show Advanced Parameters editing */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200/70 bg-emerald-50/20 text-emerald-800 text-xs font-semibold uppercase tracking-wider hover:bg-emerald-50/80 transition cursor-pointer mt-2 sm:mt-10"
        >
          <Sliders className="w-3.5 h-3.5" />
          {showAdvanced ? "Hide Controls" : "Adjust Parameters"}
        </button>
      </div>

      {/* Main Core Controls */}
      <div className="my-auto flex flex-col items-center justify-center gap-6 w-full max-w-2xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full">
          {/* Stock Dropdown Selector */}
          <div className="relative w-full sm:w-64" ref={stockRef}>
            <label className="text-[10px] font-mono uppercase text-gray-400 block mb-1.5 tracking-wider px-1">
              Select Asset Class
            </label>
            <button
              id="stock-selector-btn"
              onClick={() => {
                setStockOpen(!stockOpen);
                setHorizonOpen(false);
              }}
              className="w-full bg-[#a3f0b8] hover:bg-[#92e4a8] text-gray-800 font-semibold px-5 py-3 rounded-xl shadow-sm border border-emerald-300/40 flex items-center justify-between transition cursor-pointer text-sm sm:text-base"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-800" />
                <span className="font-mono text-emerald-950">{selectedStock}</span>
                <span className="text-xs text-emerald-800/80 font-normal">
                  ({STOCKS_DATA[selectedStock].name})
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-emerald-800 transition-transform duration-200 ${stockOpen ? "rotate-180" : ""}`} />
            </button>

            {stockOpen && (
              <div className="absolute left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-emerald-100/80 overflow-hidden z-50">
                <div className="max-h-60 overflow-y-auto font-sans">
                  {(Object.keys(STOCKS_DATA) as StockSymbol[]).map((sym) => (
                    <button
                      key={sym}
                      onClick={() => handleStockSelect(sym)}
                      className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-emerald-50 transition ${
                        selectedStock === sym ? "bg-emerald-100/50 text-emerald-900 font-bold" : "text-gray-700"
                      }`}
                    >
                      <div>
                        <span className="font-mono font-bold text-gray-900 mr-2">{sym}</span>
                        <span className="text-xs text-gray-500">{STOCKS_DATA[sym].name}</span>
                      </div>
                      <span className="text-xs font-mono text-gray-400">${STOCKS_DATA[sym].defaultParams.Close.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Time Horizon Dropdown Selector */}
          <div className="relative w-full sm:w-64" ref={horizonRef}>
            <label className="text-[10px] font-mono uppercase text-gray-400 block mb-1.5 tracking-wider px-1">
              Select Evaluation Horizon
            </label>
            <button
              id="horizon-selector-btn"
              onClick={() => {
                setHorizonOpen(!horizonOpen);
                setStockOpen(false);
              }}
              className="w-full bg-[#a3f0b8] hover:bg-[#92e4a8] text-gray-800 font-semibold px-5 py-3 rounded-xl shadow-sm border border-emerald-300/40 flex items-center justify-between transition cursor-pointer text-sm sm:text-base"
            >
              <span className="text-emerald-950">{selectedHorizon} Range</span>
              <ChevronDown className={`w-4 h-4 text-emerald-800 transition-transform duration-200 ${horizonOpen ? "rotate-180" : ""}`} />
            </button>

            {horizonOpen && (
              <div className="absolute left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-emerald-100/80 overflow-hidden z-50">
                <div className="font-sans">
                  {(["1 Day", "5 Days", "1 Month", "3 Months"] as TimeHorizon[]).map((hor) => (
                    <button
                      key={hor}
                      onClick={() => handleHorizonSelect(hor)}
                      className={`w-full text-left px-5 py-3 text-sm hover:bg-emerald-50 transition border-b border-gray-50 last:border-0 ${
                        selectedHorizon === hor ? "bg-emerald-100/50 text-emerald-900 font-bold" : "text-gray-700"
                      }`}
                    >
                      {hor} Range
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CSV Drag and Drop Zone & Real Market Data Selection */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-full max-w-2xl rounded-2xl p-5 border-2 border-dashed transition-all duration-300 relative overflow-visible ${
            csvRecords.length > 0 
              ? 'bg-emerald-50/10 border-emerald-300/40 shadow-sm' 
              : isDragging
                ? 'bg-emerald-100/25 border-emerald-500 scale-[1.01] shadow-md animate-pulse'
                : 'bg-neutral-50/5 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/5'
          }`}
        >
          {csvRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-4 px-2 text-center select-none">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                <Upload className="w-6 h-6 text-emerald-600 animate-pulse" />
              </div>
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5 justify-center">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Feed Real Market Data
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mt-1 mb-3">
                Drag & drop <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-emerald-800 text-[10px] font-bold">merged_stock_sentiment_data.csv</code> here, or click below to upload.
              </p>
              
              <label className="bg-[#a3f0b8] hover:bg-[#92e4a8] text-emerald-950 font-bold px-4 py-2 rounded-xl text-xs shadow-sm border border-emerald-300/30 transition cursor-pointer inline-flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Browse CSV File
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
              </label>
              
              {csvError && (
                <div className="mt-3 flex items-center gap-1 text-[11px] text-rose-600 font-semibold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100 animate-shake">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {csvError}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Header section of CSV status */}
              <div className="flex justify-between items-center border-b border-emerald-100/30 pb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 animate-bounce" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950">Real Stock Data Active</h4>
                    <p className="text-[10px] text-gray-400 font-mono">
                      Parsed {csvRecords.length} records successfully
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={clearCsv}
                  className="text-[10px] font-semibold text-rose-700 hover:text-rose-950 hover:bg-rose-50 border border-rose-100 bg-white px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  Clear Data
                </button>
              </div>

              {/* Date selection row */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
                <div className="flex-1 relative" ref={dateDropdownRef}>
                  <label className="text-[10px] font-mono uppercase text-gray-400 block mb-1 tracking-wider px-0.5">
                    Select Historical Trading Date
                  </label>
                  <button
                    onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
                    className="w-full bg-white hover:bg-emerald-50/20 text-gray-800 font-semibold px-4 py-2.5 rounded-xl shadow-sm border border-emerald-100/70 flex items-center justify-between transition cursor-pointer text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      <span>{realDate || "No date selected"}</span>
                      {sentimentLabel && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          sentimentLabel.toLowerCase() === 'positive' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : sentimentLabel.toLowerCase() === 'negative'
                              ? 'bg-rose-50 text-rose-600 border border-rose-100'
                              : 'bg-gray-50 text-gray-600 border border-gray-100'
                        }`}>
                          {sentimentLabel} {sentimentScore !== undefined ? `(${sentimentScore.toFixed(2)})` : ''}
                        </span>
                      )}
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-emerald-700 transition-transform duration-200 ${dateDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {dateDropdownOpen && (
                    <div className="absolute left-0 mt-1.5 w-full bg-white rounded-xl shadow-xl border border-emerald-100/60 overflow-hidden z-50 animate-fadeIn">
                      <div className="max-h-56 overflow-y-auto font-mono text-xs">
                        {filterRecordsForStock(csvRecords, selectedStock).map((rec) => {
                          const globalIndex = csvRecords.indexOf(rec);
                          const isSel = selectedCsvIndex === globalIndex;
                          return (
                            <button
                              key={`${rec.company}-${rec.date}`}
                              onClick={() => {
                                selectRecord(rec, globalIndex);
                                setDateDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2 hover:bg-emerald-50 transition border-b border-gray-50 last:border-0 flex items-center justify-between ${
                                isSel ? "bg-emerald-100/40 text-emerald-950 font-bold" : "text-gray-700"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900">{rec.date}</span>
                                {rec.sentiment && (
                                  <span className={`text-[9px] scale-90 px-1 py-0.2 rounded font-bold uppercase ${
                                    rec.sentiment.toLowerCase() === 'positive' 
                                      ? 'bg-emerald-50 text-emerald-700' 
                                      : rec.sentiment.toLowerCase() === 'negative'
                                        ? 'bg-rose-50 text-rose-600'
                                        : 'bg-gray-50 text-gray-600'
                                  }`}>
                                    {rec.sentiment}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-emerald-800 font-bold">
                                Close: ${rec.close.toFixed(2)}
                              </span>
                            </button>
                          );
                        })}
                        {filterRecordsForStock(csvRecords, selectedStock).length === 0 && (
                          <div className="p-4 text-center text-gray-400 text-xs">
                            No records found for {selectedStock} in this CSV.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Data Summary Values Grid */}
              <div className="grid grid-cols-5 gap-2 bg-emerald-50/20 p-3 rounded-xl border border-emerald-100/40 font-mono text-[10px]">
                <div className="flex flex-col">
                  <span className="text-gray-400 uppercase tracking-wider">Open</span>
                  <span className="font-bold text-gray-800 mt-0.5">${params.Open.toFixed(2)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-400 uppercase tracking-wider">High</span>
                  <span className="font-bold text-gray-800 mt-0.5">${params.High.toFixed(2)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-400 uppercase tracking-wider">Low</span>
                  <span className="font-bold text-gray-800 mt-0.5">${params.Low.toFixed(2)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-400 uppercase tracking-wider">Close</span>
                  <span className="font-bold text-emerald-950 mt-0.5">${params.Close.toFixed(2)}</span>
                </div>
                <div className="flex flex-col col-span-1">
                  <span className="text-gray-400 uppercase tracking-wider">Volume</span>
                  <span className="font-bold text-gray-800 mt-0.5">{(params.Volume / 1000000).toFixed(1)}M</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Company Quick Bio */}
        <div className="w-full text-center px-4 bg-lime-50/10 py-2.5 rounded-lg border border-dashed border-emerald-100/30 text-xs text-emerald-800 max-w-lg">
          <Info className="w-3.5 h-3.5 inline mr-1 text-emerald-600/80 align-text-bottom" />
          <span className="font-semibold text-emerald-950 mr-1">{selectedStock}:</span>
          {STOCKS_DATA[selectedStock].description}
        </div>

        {/* Advanced pricing Sliders */}
        {showAdvanced && (
          <div className="w-full bg-white/95 rounded-2xl p-5 shadow-inner border border-emerald-100/60 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-emerald-50 pb-2">
              <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-emerald-700 animate-pulse" />
                Raw OHLCV Parameter Settings
              </h3>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Interactive Slider Engine
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Open Setting */}
              <div className="flex flex-col gap-1.5 bg-emerald-50/10 p-2.5 rounded-lg border border-emerald-50/30">
                <div className="flex justify-between font-mono">
                  <span className="text-gray-500">Open Price:</span>
                  <span className="font-bold text-gray-800">${params.Open.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={Math.max(1, params.Open - 50)}
                  max={params.Open + 50}
                  step={0.1}
                  value={params.Open}
                  onChange={(e) => updateParam("Open", parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-ew-resize h-1.5 rounded-lg bg-gray-200"
                />
              </div>

              {/* Close Setting */}
              <div className="flex flex-col gap-1.5 bg-emerald-50/10 p-2.5 rounded-lg border border-emerald-50/30">
                <div className="flex justify-between font-mono">
                  <span className="text-gray-500">Close Price:</span>
                  <span className="font-bold text-emerald-900">${params.Close.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={Math.max(1, params.Close - 50)}
                  max={params.Close + 50}
                  step={0.1}
                  value={params.Close}
                  onChange={(e) => updateParam("Close", parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-ew-resize h-1.5 rounded-lg bg-gray-200"
                />
              </div>

              {/* High Setting */}
              <div className="flex flex-col gap-1.5 bg-emerald-50/10 p-2.5 rounded-lg border border-emerald-50/30">
                <div className="flex justify-between font-mono">
                  <span className="text-gray-500">High Price:</span>
                  <span className="font-bold text-emerald-800">${params.High.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={Math.max(params.Close, params.Open)}
                  max={Math.max(params.Close, params.Open) + 60}
                  step={0.1}
                  value={params.High}
                  onChange={(e) => updateParam("High", parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-ew-resize h-1.5 rounded-lg bg-gray-200"
                />
              </div>

              {/* Low Setting */}
              <div className="flex flex-col gap-1.5 bg-emerald-50/10 p-2.5 rounded-lg border border-emerald-50/30">
                <div className="flex justify-between font-mono">
                  <span className="text-gray-500">Low Price:</span>
                  <span className="font-bold text-emerald-800">${params.Low.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={Math.max(1, Math.min(params.Close, params.Open) - 60)}
                  max={Math.min(params.Close, params.Open)}
                  step={0.1}
                  value={params.Low}
                  onChange={(e) => updateParam("Low", parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-ew-resize h-1.5 rounded-lg bg-gray-200"
                />
              </div>

              {/* Volume Setting */}
              <div className="flex flex-col gap-1.5 bg-emerald-50/10 p-2.5 rounded-lg border border-emerald-50/30 md:col-span-2">
                <div className="flex justify-between font-mono">
                  <span className="text-gray-500">Trading Volume:</span>
                  <span className="font-bold text-gray-800">{(params.Volume / 1000000).toFixed(2)}M shares</span>
                </div>
                <input
                  type="range"
                  min={100000}
                  max={200000000}
                  step={100000}
                  value={params.Volume}
                  onChange={(e) => updateParam("Volume", parseInt(e.target.value))}
                  className="w-full accent-emerald-500 cursor-ew-resize h-1.5 rounded-lg bg-gray-200"
                />
              </div>
            </div>

            {/* Calculated Feature Indicators Live */}
            <div className="bg-emerald-950 text-emerald-100 p-4 rounded-xl font-mono text-xs flex flex-col gap-2 shadow-inner">
              <span className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase">
                XGBoost Computed Real-Time Engineered Features:
              </span>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                <div>
                  <div className="text-emerald-300">close_position</div>
                  <div className="text-sm font-bold text-white mt-0.5">{engineered.close_position}</div>
                </div>
                <div>
                  <div className="text-emerald-300">body_ratio</div>
                  <div className="text-sm font-bold text-white mt-0.5">{engineered.body_ratio}</div>
                </div>
                <div>
                  <div className="text-emerald-300">shadow_ratio</div>
                  <div className="text-sm font-bold text-white mt-0.5">{engineered.shadow_ratio}</div>
                </div>
                <div>
                  <div className="text-emerald-300">log_volume</div>
                  <div className="text-sm font-bold text-white mt-0.5">{engineered.log_volume}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Big Predict Button */}
        <button
          id="predict-btn"
          onClick={onPredict}
          className="bg-[#8de3a4] hover:bg-[#7ce095] text-emerald-950 font-bold px-12 py-4 rounded-2xl shadow-md border-b-4 border-emerald-600 active:border-b-0 hover:translate-y-0.5 transition cursor-pointer text-lg sm:text-xl transform duration-100 mt-2 hover:shadow-lg w-full max-w-xs text-center"
        >
          Predict
        </button>
      </div>

      {/* Frame decoration details */}
      <div className="text-center font-mono text-[9px] text-[#4ea06c]/70 mt-4 tracking-wider uppercase">
        XGBoost Classification Tree • Standard Split Strategy
      </div>
    </div>
  );
}
