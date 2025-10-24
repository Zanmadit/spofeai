from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sklearn.preprocessing import LabelEncoder
import pandas as pd
import joblib

# Load model and data
model_data = joblib.load("models/model.pkl")
model = model_data["model"] if isinstance(model_data, dict) else model_data

features_df = pd.read_csv("data/features.csv")

app = FastAPI(title="Spofeai Predictor")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # твой Vite dev сервер
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class MatchInput(BaseModel):
    home_team: str
    away_team: str

# Helper function to compute derived features
def compute_features(home_team: str, away_team: str):
    
    home_avg_goals = features_df.loc[features_df["home_team"]==home_team, "home_score"].mean()
    away_avg_goals = features_df.loc[features_df["away_team"]==away_team, "away_score"].mean()

    goal_diff_avg = home_avg_goals - away_avg_goals

    top_teams = ["Manchester City", "Liverpool", "Arsenal", "Chelsea", "Manchester United"]
    home_is_top = int(home_team in top_teams)
    away_is_top = int(away_team in top_teams)

    def team_form(team, is_home=True):
        if is_home:
            df_team = features_df[features_df["home_team"]==team].tail(5)
            points = df_team.apply(lambda row: 3 if row["home_score"]>row["away_score"] else 1 if row["home_score"]==row["away_score"] else 0, axis=1)
        else:
            df_team = features_df[features_df["away_team"]==team].tail(5)
            points = df_team.apply(lambda row: 3 if row["away_score"]>row["home_score"] else 1 if row["away_score"]==row["home_score"] else 0, axis=1)
        return points.mean() if len(points)>0 else 1.5

    home_form = team_form(home_team, is_home=True)
    away_form = team_form(away_team, is_home=False)

    home_points = features_df.loc[features_df["home_team"]==home_team].apply(
        lambda row: 3 if row["home_score"]>row["away_score"] else 1 if row["home_score"]==row["away_score"] else 0, axis=1
    ).mean()
    away_points = features_df.loc[features_df["away_team"]==away_team].apply(
        lambda row: 3 if row["away_score"]>row["home_score"] else 1 if row["away_score"]==row["home_score"] else 0, axis=1
    ).mean()
    points_diff = home_points - away_points

    le_team = LabelEncoder()
    le_team.fit(list(features_df["home_team"].unique()) + list(features_df["away_team"].unique()))
    home_team_enc = le_team.transform([home_team])[0]
    away_team_enc = le_team.transform([away_team])[0]

    return pd.DataFrame([{
        "home_team_enc": home_team_enc,
        "away_team_enc": away_team_enc,
        "home_team_avg_goals": home_avg_goals,
        "away_team_avg_goals": away_avg_goals,
        "goal_diff_avg": goal_diff_avg,
        "home_is_top": home_is_top,
        "away_is_top": away_is_top,
        "home_form": home_form,
        "away_form": away_form,
        "points_diff": points_diff
    }])

# API endpoints
@app.post("/predict")
def predict(match: MatchInput):
    X = compute_features(match.home_team, match.away_team)
    pred = model.predict(X)[0]
    return {"prediction": str(pred)}
