import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function App() {
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [prediction, setPrediction] = useState("");
  const [loading, setLoading] = useState(false);
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  async function handlePredict() {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ home_team: homeTeam, away_team: awayTeam }),
      });
      const data = await res.json();
      setPrediction(data.prediction);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch prediction");
    }
    setLoading(false);
  }

  async function handlePlaceBet() {
    if (!publicKey) {
      alert("Connect your Phantom Wallet first!");
      return;
    }

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: publicKey, 
        lamports: 0.01 * 1e9, 
      })
    );

    try {
      const signature = await sendTransaction(transaction, connection);

      const latestBlockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      });

      alert("Bet sent! Signature: " + signature);
    } catch (err) {
      console.error(err);
      alert("Transaction failed");
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 p-6">
      <div className="w-full max-w-md bg-gray-900 rounded-3xl shadow-2xl p-8 space-y-6">
        <h1 className="text-3xl font-bold text-yellow-400 text-center">Spofeai</h1>

        <div className="w-full flex justify-center">
          <WalletMultiButton className="bg-gradient-to-r from-yellow-500 to-red-500 text-black font-bold py-3 px-6 rounded-xl transition-all duration-200" />
        </div>

        <div className="flex flex-col gap-4">
          <input
            className="p-3 rounded-xl bg-gray-800/50 placeholder-gray-400 text-white focus:ring-2 focus:ring-yellow-400 outline-none w-full"
            placeholder="Home team"
            value={homeTeam}
            onChange={(e) => setHomeTeam(e.target.value)}
          />
          <input
            className="p-3 rounded-xl bg-gray-800/50 placeholder-gray-400 text-white focus:ring-2 focus:ring-yellow-400 outline-none w-full"
            placeholder="Away team"
            value={awayTeam}
            onChange={(e) => setAwayTeam(e.target.value)}
          />
        </div>

        <button
          onClick={handlePredict}
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-bold hover:scale-105 transform transition duration-200 disabled:opacity-50"
        >
          {loading ? "Predicting..." : "Predict"}
        </button>

        {prediction && (
          <p className="text-center text-green-400 font-semibold text-lg">
            Predicted Winner: {prediction}
          </p>
        )}

        <button
          onClick={handlePlaceBet}
          className="w-full py-3 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl font-bold hover:scale-105 transform transition duration-200"
        >
          Place Bet (0.01 SOL)
        </button>
      </div>
    </div>
  );
}
