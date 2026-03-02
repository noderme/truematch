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
          console.error("Profile processing failed");
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
      router.push(`/chat/${matchId}?currentUserId=${userId}`);
    }, 2000); // animation duration
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

  return (
    <div className="min-h-screen bg-black flex flex-col items-center px-4 py-12 space-y-8 relative">
      {matches.map((m) => (
        <div
          key={m.userId}
          className="relative w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden bg-zinc-900"
        >
          <img
            src={
              m.photos?.[0] ||
              "https://via.placeholder.com/400x500?text=No+Photo"
            }
            alt={m.username}
            className="w-full h-[500px] object-cover"
          />

          <div className="absolute bottom-0 left-0 w-full bg-black/60 p-4 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">{m.username}</h2>
              <div className="text-sm font-semibold text-green-400">
                {m.totalCompatibility}% compat
              </div>
            </div>

            {/* Traits */}
            <div className="flex flex-wrap gap-2">
              {m.details.commonTraits.map((t, i) => (
                <span
                  key={i}
                  className="px-2 py-1 text-xs bg-blue-600 rounded-full border border-blue-500"
                >
                  {t}
                </span>
              ))}
              {m.details.theyHaveWhatIWant.map((t, i) => (
                <span
                  key={i}
                  className="px-2 py-1 text-xs bg-purple-600 rounded-full border border-purple-500"
                >
                  {t}
                </span>
              ))}
              {m.details.iHaveWhatTheyWant.map((t, i) => (
                <span
                  key={i}
                  className="px-2 py-1 text-xs bg-green-600 rounded-full border border-green-500"
                >
                  {t}
                </span>
              ))}
            </div>

            {/* Mini Bars */}
            <div className="flex gap-2 mt-2">
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

            {/* Perspective */}
            <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-200">
              <div className="bg-zinc-800/70 p-2 rounded-md text-center">
                You match their desires: {m.details.myPerspective}%
              </div>
              <div className="bg-zinc-800/70 p-2 rounded-md text-center">
                They match your desires: {m.details.theirPerspective}%
              </div>
            </div>

            {/* Start Chat */}
            <button
              onClick={() => startChat(m.userId)}
              className="mt-4 w-full bg-green-400 text-black font-bold py-2 rounded-xl"
            >
              Start Chat
            </button>
          </div>

          {/* Animation Overlay */}
          {showAnimation && selectedMatchId === m.userId && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
              <div className="relative w-40 h-40">
                {/* Female Circle */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 border-4 border-pink-500 rounded-full animate-spin-slow flex items-center justify-center">
                    ♀
                  </div>
                </div>
                {/* Male Circle merging */}
                <div className="absolute inset-0 flex items-center justify-center animate-merge-left">
                  <div className="w-20 h-20 border-4 border-blue-500 rounded-full flex items-center justify-center">
                    ♂
                  </div>
                </div>
                {/* Heart after merge */}
                <div className="absolute inset-0 flex items-center justify-center animate-heart text-3xl text-red-500">
                  ❤️
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
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
      <div className="flex justify-between text-[10px] mb-1">
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
