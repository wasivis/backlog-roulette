import { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard";

function App() {
  const [steamId, setSteamId] = useState(localStorage.getItem("steamId"));
  const [manualId, setManualId] = useState("");
  const [manualError, setManualError] = useState("");

  useEffect(() => {
    // Check if there is a steamId in the URL (coming back from login)
    const params = new URLSearchParams(window.location.search);
    const idFromUrl = params.get("steamId");

    if (idFromUrl) {
      setSteamId(idFromUrl);
      localStorage.setItem("steamId", idFromUrl);
      // Clean the URL so it looks nice
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const normalizedId = manualId.trim();

    // Steam64 IDs are 17 digits and start with 7656
    if (normalizedId.length === 17 && normalizedId.startsWith("7656")) {
      setManualError("");
      setSteamId(normalizedId);
      localStorage.setItem("steamId", normalizedId);
    } else {
      setManualError(
        "Invalid Steam64 ID. Please enter the 17-digit number starting with 7656.",
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("steamId");
    setSteamId(null);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {steamId ? (
        <div className="relative">
          {/* Dashboard now receives the logout function to trigger from its own UI */}
          <Dashboard steamId={steamId} onLogout={handleLogout} />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-screen text-white p-6">
          <div className="max-w-md w-full text-center">
            <h1 className="text-6xl font-black mb-2 tracking-tighter italic bg-gradient-to-br from-white to-slate-500 bg-clip-text text-transparent">
              BACKLOG ROULETTE
            </h1>
            <p className="text-slate-400 mb-10 font-medium">
              A random game picker for your Steam library.
            </p>

            {/* Option 1: Official Steam OpenID */}
            <a
              href={`${import.meta.env.VITE_API_URL}/auth/steam`}
              className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-black font-bold rounded-2xl hover:bg-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all mb-8 shadow-xl"
            >
              <img
                src="/steam-logo.png"
                alt="Steam"
                className="h-6"
              />
              <span>SIGN IN WITH STEAM</span>
            </a>

            {/* Separator */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 h-px bg-slate-800"></div>
              <span className="text-slate-500 text-xs font-black tracking-[0.3em] uppercase">
                OR
              </span>
              <div className="flex-1 h-px bg-slate-800"></div>
            </div>

            {/* Option 2: Manual ID Input */}
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter 17-digit Steam64 ID"
                  value={manualId}
                  onChange={(e) => {
                    setManualId(e.target.value);
                    if (manualError) {
                      setManualError("");
                    }
                  }}
                  inputMode="numeric"
                  maxLength={17}
                  aria-invalid={manualError ? "true" : "false"}
                  className={`w-full bg-slate-900 border rounded-2xl px-5 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 transition-all ${
                    manualError
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/60"
                      : "border-slate-800 focus:border-purple-500 focus:ring-purple-500"
                  }`}
                />
              </div>
              {manualError ? (
                <p className="text-sm text-red-400 text-left" role="alert">
                  {manualError}
                </p>
              ) : null}
              <button
                type="submit"
                className="w-full py-4 bg-slate-800 text-slate-300 font-bold rounded-2xl hover:bg-slate-700 hover:text-white transition-all"
              >
                USE PUBLIC ID
              </button>
            </form>

            <div className="mt-8 space-y-2">
              <a
                href="https://steamid.io/"
                target="_blank"
                rel="noreferrer"
                className="text-sm text-slate-400 hover:text-purple-300 underline underline-offset-4 transition-colors"
              >
                Where do I find my Steam64 ID?
              </a>
              <p className="text-xs text-slate-500 leading-relaxed uppercase tracking-wider">
                Note: Your game library must be set to "Public" in Steam privacy
                settings.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
