import pandas as pd

df = pd.read_csv("merged_stock_sentiment_data.csv")

for company, group in df.groupby("Company"):
    group.to_csv(f"{company}_data.csv")