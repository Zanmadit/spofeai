import express from "express";
import fetch from "node-fetch";
import { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js";

const app = express();
app.use(express.json());

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

app.post("/predict", async (req, res) => {
  const { home_team, away_team } = req.body;

  const body = {
    home_team,
    away_team,
    home_team_avg_goals: 1.8,
    away_team_avg_goals: 1.3,
    goal_diff_avg: 0.5,
    home_is_top: 1,
    away_is_top: 0,
    home_form: 2.5,
    away_form: 1.9,
    points_diff: 0.6
  };

  const response = await fetch("http://localhost:8000/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await response.json();
  res.json({ result: data.prediction });
});

app.listen(5000, () => console.log("✅ Node backend running on port 5000"));
