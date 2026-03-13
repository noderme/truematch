"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface MatchDetails {
  myPerspective: number;
  theirPerspective: number;
  iHaveWhatTheyWant: string[];
  theyHaveWhatIWant: string[];
  commonTraits: string[];
}

interface Match {
  userId: number;
  username: string;
  totalCompatibility: number;
  characterCompatibility: number;
  desiredCompatibility: number;
  details: MatchDetails;
  photos?: string[];
}

export default function MatchClient({ userId }: { userId: number }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showWhyMatched, setShowWhyMatched] = useState(false);

  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);

  const [showAnimation, setShowAnimation] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);

  // Track removed match IDs so they don't reappear on next poll cycle
  const removedIds = useRef<Set<number>>(new Set());

  const router = useRouter();

  // ---------------- FETCH WITH POLLING ----------------
  useEffect(() => {
    if (!userId) return;
    let interval: NodeJS.Timeout;
    let done = false;

    async function fetchMatches() {
      try {
        const statusRes = await fetch(`/api/profile-status?userId=${userId}`);
        const statusData = await statusRes.json();

        if (statusData.status === "ready" || statusData.status === "processed") {
          done = true;
          clearInterval(interval);

          const [matchRes, chatsRes] = await Promise.all([
            fetch(`/api/preComputed?userId=${userId}`),
            fetch(`/api/chats?userId=${userId}`),
          ]);

          const matchData = await matchRes.json();
          const chatsData = chatsRes.ok ? await chatsRes.json() : { chats: [] };

          const chattedIds = new Set<number>(
            (chatsData.chats || []).map((c: any) => Number(c.matchedUserId)),
          );

          const filtered = (matchData.matches || []).filter(
            (m: any) => !chattedIds.has(m.userId) && !removedIds.current.has(m.userId),
          );

          setMatches(filtered);
          setLoading(false);
        } else if (statusData.status === "failed") {
          done = true;
          clearInterval(interval);
          setLoading(false);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }

    fetchMatches();
    interval = setInterval(() => { if (!done) fetchMatches(); }, 2000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => { setPhotoIndex(0); setShowWhyMatched(false); }, [currentIndex]);

  // ---------------- REMOVE MATCH ----------------
  const removeMatch = async (matchId: number) => {
    removedIds.current.add(matchId);
    setMatches((prev) => {
      const updated = prev.filter((m) => m.userId !== matchId);
      if (updated.length === 0) setCurrentIndex(0);
      else if (currentIndex >= updated.length) setCurrentIndex(updated.length - 1);
      return updated;
    });

    try {
      await fetch("/api/remove-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, matchId }),
      });
    } catch (err) {
      console.error("DB remove failed:", err);
    }
  };

  // ---------------- START CHAT ----------------
  const startChat = (matchId: number) => {
    setSelectedMatchId(matchId);
    setShowAnimation(true);
    setTimeout(() => {
      router.push(`/chat/${userId}/${matchId}`);
    }, 800);
  };

  // ---------------- SWIPE LOGIC ----------------
  const handleStart = (clientX: number) => {
    setIsDragging(true);
    startX.current = clientX;
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;
    setDragX(clientX - startX.current);
  };

  const handleEnd = (matchId: number) => {
    if (!isDragging) return;
    setIsDragging(false);

    if (dragX < -120) {
      setDragX(-1000);
      setTimeout(() => { removeMatch(matchId); setDragX(0); }, 250);
    } else if (dragX > 120) {
      setDragX(1000);
      setTimeout(() => { startChat(matchId); setDragX(0); }, 250);
    } else {
      setDragX(0);
    }
  };

  // ---------------- LOADING STATE ----------------
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex flex-col items-center justify-center gap-6 px-4">
        <div className="w-full max-w-sm rounded-3xl overflow-hidden border border-slate-800/60 shadow-2xl shadow-black/60">
          <div className="shimmer h-[520px] w-full" />
          <div className="bg-slate-900 p-5 flex flex-col gap-3">
            <div className="flex justify-between">
              <div className="shimmer h-6 w-32 rounded-lg" />
              <div className="shimmer h-5 w-16 rounded-lg" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[80, 64, 96, 72].map((w) => (
                <div key={w} className="shimmer h-5 rounded-full" style={{ width: w }} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-fuchsia-500/70 animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
          <p className="text-sm text-slate-500">AI is finding your matches…</p>
        </div>
      </div>
    );
  }

  // ---------------- EMPTY STATE ----------------
  if (!matches.length) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-slate-800/60 border border-slate-700 flex items-center justify-center text-3xl">
          ✦
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-200">No matches yet</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-xs">
            Your AI analysis might still be running, or no strong matches were found in your city yet.
          </p>
        </div>
      </div>
    );
  }

  const m = matches[currentIndex];
  const photos =
    m.photos && m.photos.length > 0
      ? m.photos
      : ["https://via.placeholder.com/400x600?text=No+Photo"];
  const currentPhoto = photos[photoIndex];
  const compat = m.totalCompatibility;
  const compatColor =
    compat >= 70 ? "text-emerald-400" : compat >= 50 ? "text-amber-400" : "text-rose-400";

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col items-center justify-center px-4 py-4 gap-4">

      {/* Progress dots */}
      <div className="flex items-center gap-1.5">
        {matches.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === currentIndex
                ? "w-5 bg-fuchsia-400"
                : "w-1.5 bg-slate-700 hover:bg-slate-500"
            }`}
          />
        ))}
      </div>

      {/* Card */}
      <div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl shadow-black/70 border border-slate-800/40 select-none"
        style={{
          transform: `translateX(${dragX}px) rotate(${dragX / 22}deg)`,
          transition: isDragging ? "none" : "transform 0.25s ease",
          cursor: isDragging ? "grabbing" : "grab",
        }}
        onMouseDown={(e) => handleStart(e.clientX)}
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseUp={() => handleEnd(m.userId)}
        onMouseLeave={() => { if (isDragging) handleEnd(m.userId); }}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={() => handleEnd(m.userId)}
      >
        {/* Photo */}
        <img
          src={currentPhoto}
          alt={m.username}
          className="w-full h-[520px] object-cover"
          draggable={false}
        />

        {/* Photo dot indicators */}
        {photos.length > 1 && (
          <div className="absolute top-3 left-0 right-0 flex justify-center gap-1.5 px-4 z-20">
            {photos.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-200 ${
                  i === photoIndex ? "bg-white w-6" : "bg-white/40 w-3"
                }`}
              />
            ))}
          </div>
        )}

        {/* Photo navigation tap zones */}
        {photoIndex > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); setPhotoIndex((p) => p - 1); }}
            className="absolute left-0 top-0 h-full w-1/3 z-10"
          />
        )}
        {photoIndex < photos.length - 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); setPhotoIndex((p) => p + 1); }}
            className="absolute right-0 top-0 h-full w-1/3 z-10"
          />
        )}

        {/* Like overlay */}
        {dragX > 50 && (
          <div
            className="absolute inset-0 bg-gradient-to-r from-emerald-500/35 to-transparent flex items-center pl-6 pt-12 z-20 pointer-events-none"
            style={{ opacity: Math.min(dragX / 110, 1) }}
          >
            <span className="text-emerald-300 text-3xl font-extrabold tracking-widest rotate-[-12deg] border-2 border-emerald-400/70 px-3 py-1 rounded-xl drop-shadow-lg">
              LIKE
            </span>
          </div>
        )}

        {/* Nope overlay */}
        {dragX < -50 && (
          <div
            className="absolute inset-0 bg-gradient-to-l from-rose-500/35 to-transparent flex items-center justify-end pr-6 pt-12 z-20 pointer-events-none"
            style={{ opacity: Math.min(-dragX / 110, 1) }}
          >
            <span className="text-rose-300 text-3xl font-extrabold tracking-widest rotate-[12deg] border-2 border-rose-400/70 px-3 py-1 rounded-xl drop-shadow-lg">
              NOPE
            </span>
          </div>
        )}

        {/* Bottom info overlay */}
        <div className="absolute bottom-0 w-full bg-gradient-to-t from-black via-black/85 to-transparent px-5 pt-16 pb-5 flex flex-col gap-3 z-10">
          {/* Name + compat */}
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold text-white">{m.username}</h2>
            <div className={`text-xl font-bold tabular-nums ${compatColor}`}>
              {compat}%
            </div>
          </div>

          {/* Common traits */}
          {m.details.commonTraits.length > 0 && (
            <div className="flex flex-wrap gap-1.5 max-h-16 overflow-hidden">
              {m.details.commonTraits.slice(0, 6).map((t, i) => (
                <span
                  key={i}
                  className="px-2.5 py-0.5 text-xs rounded-full bg-fuchsia-500/20 border border-fuchsia-500/30 text-fuchsia-200"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Mini bars */}
          <div className="flex gap-3">
            <MiniBar label="Character" value={m.characterCompatibility} color="bg-sky-500" />
            <MiniBar label="Desire" value={m.desiredCompatibility} color="bg-fuchsia-500" />
          </div>

          {/* Why you matched — tap to expand */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowWhyMatched((v) => !v); }}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition self-start"
          >
            <span className="text-[10px]">{showWhyMatched ? "▲" : "▼"}</span>
            Why you matched
          </button>

          {showWhyMatched && (
            <div className="flex flex-col gap-2.5 text-xs bg-black/50 backdrop-blur rounded-xl p-3 border border-white/10">
              {m.details.theyHaveWhatIWant.length > 0 && (
                <div>
                  <p className="text-slate-400 mb-1.5">They have what you want</p>
                  <div className="flex flex-wrap gap-1">
                    {m.details.theyHaveWhatIWant.map((t, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-500/30 text-sky-200">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {m.details.iHaveWhatTheyWant.length > 0 && (
                <div>
                  <p className="text-slate-400 mb-1.5">You have what they want</p>
                  <div className="flex flex-wrap gap-1">
                    {m.details.iHaveWhatTheyWant.map((t, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-200">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={(e) => { e.stopPropagation(); startChat(m.userId); }}
            className="mt-1 w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 via-fuchsia-500 to-sky-500 text-white text-sm font-semibold shadow-lg shadow-fuchsia-900/40 hover:brightness-110 transition-all duration-200"
          >
            Start Chatting
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); removeMatch(m.userId); }}
            className="text-xs text-slate-600 hover:text-slate-400 text-center transition"
          >
            Skip
          </button>
        </div>

        {/* Chat transition animation */}
        {showAnimation && selectedMatchId === m.userId && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-50 backdrop-blur-sm">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-32 h-32 rounded-full bg-fuchsia-500/40 animate-ripple-1" />
              <div className="absolute w-32 h-32 rounded-full bg-sky-500/30 animate-ripple-2" />
              <div className="animate-fade-up flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-500 via-fuchsia-500 to-sky-500 flex items-center justify-center shadow-lg shadow-fuchsia-900/50">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-white/90 tracking-wide">Starting chat…</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-700">Swipe right to chat · left to skip</p>
    </div>
  );
}

function MiniBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex-1">
      <div className="flex justify-between text-[10px] mb-1 text-slate-400">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-1.5">
        <div
          className={`${color} h-1.5 rounded-full transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
