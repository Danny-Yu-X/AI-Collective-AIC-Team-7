export type StockSymbol = "AMZN" | "AAPL" | "TSLA";

export type TimeHorizon = "1 Day" | "5 Days" | "1 Month" | "3 Months";

export interface StockParams {
  Open: number;
  High: number;
  Low: number;
  Close: number;
  Volume: number;
}

export interface XGBoostFeatures {
  close_position: number;
  body_ratio: number;
  shadow_ratio: number;
  log_volume: number;
}

export interface PredictionResult {
  symbol: StockSymbol;
  timeHorizon: TimeHorizon;
  prediction: "UP" | "DOWN";
  confidence: number;
  features: XGBoostFeatures;
  params: StockParams;
  realDate?: string;
  sentimentLabel?: string;
  sentimentScore?: number;
}

export interface StockInfo {
  symbol: StockSymbol;
  name: string;
  defaultParams: StockParams;
  description: string;
}
