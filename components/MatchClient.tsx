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

  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);

  const [showAnimation, setShowAnimation] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);

  const router = useRouter();

  // ---------------- FETCH WITH POLLING ----------------
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

  // Reset photo index when user changes
  useEffect(() => {
    setPhotoIndex(0);
  }, [currentIndex]);

  // ---------------- REMOVE MATCH (STABLE) ----------------
  const removeMatch = async (matchId: number) => {
    setMatches((prev) => {
      const updated = prev.filter((m) => m.userId !== matchId);

      if (updated.length === 0) {
        setCurrentIndex(0);
      } else if (currentIndex >= updated.length) {
        setCurrentIndex(updated.length - 1);
      }

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
      setTimeout(() => {
        removeMatch(matchId);
        setDragX(0);
      }, 250);
    } else if (dragX > 120) {
      setDragX(1000);
      setTimeout(() => {
        startChat(matchId);
        setDragX(0);
      }, 250);
    } else {
      setDragX(0);
    }
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
  const photos =
    m.photos && m.photos.length > 0
      ? m.photos
      : ["https://via.placeholder.com/400x600?text=No+Photo"];

  const currentPhoto = photos[photoIndex];

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div
        className="relative w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden bg-zinc-900 transition-transform duration-300"
        style={{
          transform: `translateX(${dragX}px) rotate(${dragX / 20}deg)`,
        }}
        onMouseDown={(e) => handleStart(e.clientX)}
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseUp={() => handleEnd(m.userId)}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={() => handleEnd(m.userId)}
      >
        {/* IMAGE */}
        <img
          src={currentPhoto}
          alt={m.username}
          className="w-full h-[580px] object-cover"
        />

        {/* PHOTO ARROWS */}
        {photoIndex > 0 && (
          <button
            onClick={() => setPhotoIndex((prev) => prev - 1)}
            className="absolute top-1/2 left-3 -translate-y-1/2 z-50
                       w-10 h-10 flex items-center justify-center
                       bg-black/60 text-white rounded-full"
          >
            ‹
          </button>
        )}

        {photoIndex < photos.length - 1 && (
          <button
            onClick={() => setPhotoIndex((prev) => prev + 1)}
            className="absolute top-1/2 right-3 -translate-y-1/2 z-50
                       w-10 h-10 flex items-center justify-center
                       bg-black/60 text-white rounded-full"
          >
            ›
          </button>
        )}

        {/* LIKE / NOPE */}
        {dragX > 60 && (
          <div className="absolute top-10 right-6 text-green-400 text-3xl font-bold rotate-12">
            LIKE
          </div>
        )}
        {dragX < -60 && (
          <div className="absolute top-10 left-6 text-red-500 text-3xl font-bold -rotate-12">
            NOPE
          </div>
        )}

        {/* OVERLAY */}
        <div className="absolute bottom-0 w-full bg-gradient-to-t from-black via-black/70 to-transparent p-4 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">{m.username}</h2>
            <div className="text-sm font-semibold text-green-400">
              {m.totalCompatibility}% compat
            </div>
          </div>

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

          <button
            onClick={() => startChat(m.userId)}
            className="mt-3 w-full bg-green-400 text-black font-bold py-2 rounded-xl hover:bg-green-300 transition"
          >
            Start Chat
          </button>

          <div className="text-center text-xs text-gray-400 mt-1">
            {currentIndex + 1} / {matches.length}
          </div>
        </div>

        {/* HEART ANIMATION */}
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
