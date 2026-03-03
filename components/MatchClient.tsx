"use client";

import { useEffect, useState } from "react";
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
  const [showAnimation, setShowAnimation] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;
    let interval: NodeJS.Timeout;

    async function fetchMatches() {
      try {
        const statusRes = await fetch(`/api/profile-status?userId=${userId}`);
        const statusData = await statusRes.json();

        if (
          statusData.status === "ready" ||
          statusData.status === "processed"
        ) {
          clearInterval(interval);
          const res = await fetch(`/api/preComputed?userId=${userId}`);
          const data = await res.json();
          setMatches(data.matches || []);
          setLoading(false);
        } else if (statusData.status === "failed") {
          clearInterval(interval);
          setLoading(false);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }

    interval = setInterval(fetchMatches, 2000);
    fetchMatches();
    return () => clearInterval(interval);
  }, [userId]);

  const startChat = (matchId: number) => {
    setSelectedMatchId(matchId);
    setShowAnimation(true);

    setTimeout(() => {
      router.push(`/chat/${userId}/${matchId}`);
    }, 2000);
  };

  if (loading)
    return (
      <p className="text-center mt-10 text-gray-400">Finding matches...</p>
    );

  if (!matches.length)
    return (
      <p className="text-center mt-10 text-gray-400">
        No strong matches found.
      </p>
    );

  const m = matches[currentIndex];

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="relative w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden bg-zinc-900">
        {/* IMAGE */}
        <img
          src={
            m.photos?.[0] || "https://via.placeholder.com/400x600?text=No+Photo"
          }
          alt={m.username}
          className="w-full h-[580px] object-cover"
        />

        {/* LEFT ARROW */}
        {matches.length > 1 && (
          <button
            onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
            disabled={currentIndex === 0}
            className="absolute top-1/2 left-3 -translate-y-1/2 z-20
                       w-8 h-8 flex items-center justify-center
                       bg-black/40 text-white rounded-full
                       text-lg backdrop-blur-sm
                       disabled:opacity-20 hover:scale-110 transition"
          >
            ‹
          </button>
        )}

        {/* RIGHT ARROW */}
        {matches.length > 1 && (
          <button
            onClick={() =>
              setCurrentIndex((prev) => Math.min(prev + 1, matches.length - 1))
            }
            disabled={currentIndex === matches.length - 1}
            className="absolute top-1/2 right-3 -translate-y-1/2 z-20
                       w-8 h-8 flex items-center justify-center
                       bg-black/40 text-white rounded-full
                       text-lg backdrop-blur-sm
                       disabled:opacity-20 hover:scale-110 transition"
          >
            ›
          </button>
        )}

        {/* GRADIENT OVERLAY (LIGHTER, PHOTO VISIBLE) */}
        <div
          className="absolute bottom-0 left-0 w-full 
                        bg-gradient-to-t from-black via-black/70 to-transparent
                        p-4 flex flex-col gap-2"
        >
          {/* HEADER */}
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">{m.username}</h2>
            <div className="text-sm font-semibold text-green-400">
              {m.totalCompatibility}% compat
            </div>
          </div>

          {/* TRAITS (limited height to avoid blocking photo) */}
          <div className="flex flex-wrap gap-2 max-h-20 overflow-hidden">
            {m.details.commonTraits.map((t, i) => (
              <span
                key={i}
                className="px-2 py-1 text-xs bg-blue-600 rounded-full"
              >
                {t}
              </span>
            ))}
          </div>

          {/* BARS */}
          <div className="flex gap-2 mt-1">
            <MiniBar
              label="Character"
              value={m.characterCompatibility}
              color="bg-blue-500"
            />
            <MiniBar
              label="Desire"
              value={m.desiredCompatibility}
              color="bg-purple-500"
            />
          </div>

          {/* CHAT BUTTON */}
          <button
            onClick={() => startChat(m.userId)}
            className="mt-3 w-full bg-green-400 text-black font-bold py-2 rounded-xl hover:bg-green-300 transition"
          >
            Start Chat
          </button>

          {/* MATCH COUNTER */}
          <div className="text-center text-xs text-gray-400 mt-1">
            {currentIndex + 1} / {matches.length}
          </div>
        </div>

        {/* ANIMATION */}
        {showAnimation && selectedMatchId === m.userId && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
            <div className="text-6xl animate-pulse text-red-500">❤️</div>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex-1">
      <div className="flex justify-between text-[10px] mb-1 text-gray-300">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="w-full bg-zinc-800 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
