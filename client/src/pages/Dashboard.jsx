import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const REEL_CARD_WIDTH = 224;
const REEL_CARD_GAP = 16;
const REEL_ITEM_COUNT = 20;
const REEL_TARGET_INDEX = 15;

const buildSpinReel = (games, winnerGame) => {
  const fillerPool = games.filter((g) => g.appid !== winnerGame.appid);
  const randomPool = fillerPool.length > 0 ? fillerPool : games;
  const reel = Array.from({ length: REEL_ITEM_COUNT }, () =>
    randomPool[Math.floor(Math.random() * randomPool.length)]
  );
  reel[REEL_TARGET_INDEX] = winnerGame;
  return reel;
};

const Dashboard = ({ steamId, onLogout }) => {
  const [games, setGames] = useState([]);
  const [winner, setWinner] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [spinReel, setSpinReel] = useState([]);
  const [spinKey, setSpinKey] = useState(0);
  const [spinOffset, setSpinOffset] = useState(0);
  const [spacerWidth, setSpacerWidth] = useState(0);
  const reelViewportRef = useRef(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await api.get(`/steam/sync/${steamId}`);
        setGames(res.data);
      } catch (err) {
        console.error('Error fetching games:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, [steamId]);

  const spinRoulette = () => {
    if (games.length === 0) return;

    const randomIndex = Math.floor(Math.random() * games.length);
    const nextWinner = games[randomIndex];
    const reel = buildSpinReel(games, nextWinner);

    // Calculate offset mathematically — no DOM measurement needed.
    // The reel starts with a spacer of (viewportWidth / 2 - cardWidth / 2),
    // then each card is (cardWidth + gap) wide.
    // We want the center of the target card to align with the viewport center.
    // Starting x is 0, so we need to shift left by the target card's left edge
    // plus half a card, minus half the viewport width.
    const viewportWidth = reelViewportRef.current?.offsetWidth ?? 800;
    const cardStep = REEL_CARD_WIDTH + REEL_CARD_GAP;
    const calculatedSpacer = viewportWidth / 2 - REEL_CARD_WIDTH / 2;

    // Position of the target card's center from the reel's left edge (x=0)
    const targetCenterFromReelStart =
      calculatedSpacer + REEL_TARGET_INDEX * cardStep + REEL_CARD_WIDTH / 2;

    // We need to shift the reel left so that point lands at viewport center
    const offset = viewportWidth / 2 - targetCenterFromReelStart;

    setIsSpinning(true);
    setWinner(null);
    setSpinReel(reel);
    setSpacerWidth(calculatedSpacer);
    setSpinOffset(offset);
    setSpinKey((k) => k + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 font-sans overflow-x-hidden">
      <header className="max-w-6xl mx-auto mb-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tighter italic bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
          BACKLOG ROULETTE
        </h1>
        <div className="flex w-full flex-wrap items-center justify-end gap-3 sm:w-auto sm:flex-nowrap">
          <div className="bg-slate-900 px-4 py-2 rounded-full border border-slate-800 text-sm font-mono">
            Library: {games.length} Games
          </div>
          <button
            onClick={onLogout}
            className="cursor-pointer whitespace-nowrap px-4 py-2 rounded-full border border-red-500/60 text-red-300 text-sm font-semibold hover:text-red-100 hover:border-red-400 hover:bg-red-500/10 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex flex-col items-center justify-center mb-20 min-h-[400px]">
        <AnimatePresence mode="wait">
          {isSpinning ? (
            <motion.div
              key={`spinner-${spinKey}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <div
                ref={reelViewportRef}
                className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900/70 py-6 shadow-[0_30px_120px_rgba(15,23,42,0.45)]"
              >
                {/* Fade overlays */}
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-slate-950 via-slate-950/75 to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-slate-950 via-slate-950/75 to-transparent" />
                {/* Center marker line */}
                <div className="pointer-events-none absolute inset-y-4 left-1/2 z-20 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-fuchsia-400 to-transparent shadow-[0_0_24px_rgba(232,121,249,0.9)]" />
                {/* Center marker diamond */}
                <div className="pointer-events-none absolute left-1/2 top-3 z-20 h-3 w-3 -translate-x-1/2 rotate-45 rounded-sm border border-fuchsia-300 bg-fuchsia-500 shadow-[0_0_18px_rgba(217,70,239,0.95)]" />

                <motion.div
                  key={`reel-${spinKey}`}
                  initial={{ x: 0 }}
                  animate={{ x: spinOffset }}
                  transition={{ duration: 6, ease: [0.08, 0.82, 0.17, 1] }}
                  onAnimationComplete={() => {
                    const viewport = reelViewportRef.current;
                    const cards = viewport?.querySelectorAll('[data-reel-card="true"]');

                    if (viewport && cards && cards.length > 0) {
                      const viewportRect = viewport.getBoundingClientRect();
                      const viewportCenterX = viewportRect.left + viewportRect.width / 2;
                      let closestIndex = REEL_TARGET_INDEX;
                      let closestDistance = Number.POSITIVE_INFINITY;

                      cards.forEach((cardEl) => {
                        const cardRect = cardEl.getBoundingClientRect();
                        const cardCenterX = cardRect.left + cardRect.width / 2;
                        const distance = Math.abs(cardCenterX - viewportCenterX);
                        const cardIndex = Number(cardEl.getAttribute('data-reel-index'));

                        if (Number.isFinite(cardIndex) && distance < closestDistance) {
                          closestDistance = distance;
                          closestIndex = cardIndex;
                        }
                      });

                      setWinner(spinReel[closestIndex] ?? null);
                    } else {
                      setWinner(spinReel[REEL_TARGET_INDEX] ?? null);
                    }

                    setIsSpinning(false);
                  }}
                  className="flex gap-4"
                >
                  {/* Left spacer: pushes reel so index 0 starts at viewport center */}
                  <div
                    className="shrink-0"
                    style={{ width: spacerWidth }}
                  />
                  {spinReel.map((game, index) => (
                    <div
                      key={`${game.appid}-${index}-${spinKey}`}
                      data-reel-card="true"
                      data-reel-index={index}
                      className="w-56 shrink-0 overflow-hidden rounded-2xl border border-slate-700 bg-slate-800/90 shadow-2xl"
                    >
                      <img
                        src={`https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${game.appid}/header.jpg`}
                        alt={game.name}
                        className="h-32 w-full object-cover"
                      />
                      <div className="border-t border-slate-700 px-4 py-3">
                        <p className="truncate text-left text-sm font-bold uppercase tracking-wide text-white">
                          {game.name}
                        </p>
                        <p className="mt-1 text-left text-xs text-slate-400">
                          {Math.floor((game.playtime_forever ?? 0) / 60)}h logged
                        </p>
                      </div>
                    </div>
                  ))}
                  {/* Right spacer: mirrors left so the last card can also center */}
                  <div
                    className="shrink-0"
                    style={{ width: spacerWidth }}
                  />
                </motion.div>
              </div>
            </motion.div>
          ) : winner ? (
            <motion.div
              key={winner.appid}
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', damping: 15 }}
              className="text-center"
            >
              <motion.div whileHover={{ scale: 1.02 }} className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000" />
                <img
                  src={`https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${winner.appid}/header.jpg`}
                  className="relative w-[500px] rounded-lg shadow-2xl"
                  alt={winner.name}
                />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-4xl font-bold mt-8"
              >
                {winner.name}
              </motion.h2>
              <p className="text-slate-400 mt-2 italic">Your next game has been chosen.</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-slate-600 text-xl font-medium"
            >
              Don't know what to play? Let fate decide.
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={spinRoulette}
          disabled={isSpinning || games.length === 0}
          className="cursor-pointer group relative mt-12 px-12 py-4 bg-white text-black rounded-full font-black uppercase tracking-tighter overflow-hidden transition-all hover:pr-16 disabled:opacity-20"
        >
          <span className="relative z-10">
            {isSpinning ? 'Consulting Gabe Newell...' : 'Choose my next game!'}
          </span>
          <span className="absolute right-0 top-0 h-full w-12 flex items-center justify-center transform translate-x-full group-hover:translate-x-0 transition-transform">
            →
          </span>
        </button>
      </div>
    </div>
  );
};

export default Dashboard;