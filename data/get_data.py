import pandas as pd

years = list(range(2000, 2026))
all_data = []

for y in years:
    season = f"{str(y)[2:]}-{str(y+1)[2:]}" 
    url = f"https://www.football-data.co.uk/mmz4281/{season}/E0.csv"
    try:
        df = pd.read_csv(url)
        df["Season"] = f"{y}-{y+1}"

        needed_cols = ["Date", "HomeTeam", "AwayTeam", "FTHG", "FTAG", "FTR"]
        df = df[[c for c in needed_cols if c in df.columns] + ["Season"]]

        df = df.rename(columns={
            "Date": "utcDate",
            "HomeTeam": "home_team",
            "AwayTeam": "away_team",
            "FTHG": "home_score",
            "FTAG": "away_score",
            "FTR": "result"
        })

        def map_winner(r):
            if r["result"] == "H":
                return "HOME_TEAM"
            elif r["result"] == "A":
                return "AWAY_TEAM"
            else:
                return "DRAW"

        df["winner"] = df.apply(map_winner, axis=1)
        df = df.drop(columns=["result"])

        all_data.append(df)
        print(f"Season {y}-{y+1}")
    except Exception as e:
        print(f"No data for {season}: {e}")

data = pd.concat(all_data, ignore_index=True)

data["utcDate"] = pd.to_datetime(data["utcDate"], errors="coerce")

data.to_csv("data.csv", index=False)

