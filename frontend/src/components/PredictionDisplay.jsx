import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function PredictionDisplay() {
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [prediction, setPrediction] = useState("");
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  // 🔮 Получаем прогноз от FastAPI
  async function handlePredict() {
    try {
      const res = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ home_team: homeTeam, away_team: awayTeam })
      });
      const data = await res.json();
      setPrediction(data.prediction);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to fetch prediction");
    }
  }

  // 💸 Отправка SOL на devnet как "ставка"
  async function handlePlaceBet() {
    if (!publicKey) {
      alert("Connect your Phantom Wallet first!");
      return;
    }

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey("FILL_IN_RECEIVER_ADDRESS"), // <-- сюда твой кошелек / контракт
        lamports: 0.01 * 1e9 // 0.01 SOL
      })
    );

    try {
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, "processed");
      alert("✅ Bet sent! Signature: " + signature);
    } catch (err) {
      console.error(err);
      alert("❌ Transaction failed");
    }
  }

  return (
    <div className="flex flex-col items-center p-8 bg-white rounded-xl shadow-lg max-w-md mx-auto mt-10">
      <h1 className="text-3xl font-bold mb-6 text-blue-700">⚽ SportFi Predictor</h1>

      {/* 🔑 Кнопка подключения Phantom Wallet */}
      <WalletMultiButton className="mb-4 w-full" />

      {publicKey && (
        <p className="text-sm text-gray-600 mb-4">
          Connected wallet: {publicKey.toBase58()}
        </p>
      )}

      <div className="flex gap-2 w-full">
        <input
          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Home team"
          value={homeTeam}
          onChange={(e) => setHomeTeam(e.target.value)}
        />
        <input
          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Away team"
          value={awayTeam}
          onChange={(e) => setAwayTeam(e.target.value)}
        />
      </div>

      <button
        onClick={handlePredict}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg w-full hover:opacity-90 hover:scale-105 transition"
      >
        Predict
      </button>

      {prediction && (
        <p className="mt-4 text-xl font-semibold text-green-600">
          🧠 Predicted Winner: {prediction}
        </p>
      )}

      <button
        onClick={handlePlaceBet}
        className="mt-6 px-4 py-2 bg-green-500 text-white rounded-lg w-full hover:opacity-90 hover:scale-105 transition"
      >
        Place Bet (0.01 SOL)
      </button>
    </div>
  );
}
