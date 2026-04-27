import express from 'express';
import axios from 'axios';
import User from '../models/User.js';

const router = express.Router();

router.get('/sync/:steamId', async (req, res) => {
  const { steamId } = req.params;
  const API_KEY = process.env.STEAM_API_KEY;

  console.log("--- STARTING SYNC ---");
  console.log("Target SteamID:", steamId);
  console.log("API Key Found:", API_KEY ? "Yes (Hidden)" : "No (Check .env)");

  if (!API_KEY) {
    return res.status(500).json({ error: "API Key missing in server environment." });
  }

  try {
    const url = `http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${API_KEY}&steamid=${steamId}&include_appinfo=true&format=json`;
    
    console.log("Hitting Steam API...");
    const steamRes = await axios.get(url);

    // DEBUG: Look at the raw structure from Steam
    console.log("Raw Steam Data Structure:", Object.keys(steamRes.data));
    
    if (steamRes.data.response) {
      console.log("Steam Response keys:", Object.keys(steamRes.data.response));
    }

    const games = steamRes.data.response?.games || [];
    console.log(`Games found in Steam response: ${games.length}`);

    if (games.length === 0) {
      console.warn("⚠️ Warning: Steam returned 0 games. This usually means Privacy Settings are set to 'Private' or 'Friends Only' for Game Details.");
    }

    // Update MongoDB
    console.log("Updating MongoDB...");
    const user = await User.findOneAndUpdate(
      { steamId },
      { $set: { games } }, 
      { upsert: true, new: true }
    );

    console.log("MongoDB Update Successful. Record ID:", user._id);
    console.log("--- SYNC COMPLETE ---");

    // Send the array back
    res.json(user.games); 

  } catch (error) {
    console.error("❌ ERROR DURING SYNC:");
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error("Message:", error.message);
    }
    res.status(500).json({ error: "Failed to sync with Steam." });
  }
});

export default router;