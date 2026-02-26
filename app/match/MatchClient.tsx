"use client";

import { useEffect, useState } from "react";

interface MatchDetails {
  myPerspective: number;
  theirPerspective: number;
  iHaveWhatTheyWant: string[];
  theyHaveWhatTheyWant: string[];
  theyHaveWhatIWant: string[];
  commonTraits: string[];
}

interface Match {
  userId: number;
  username: string;
  totalCompatibility: number;
  characterCompatibility: number;
  desiredCompatibility: number;
  details: any;
}

export default function MatchClient({ userId }: { userId: number }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMatches() {
      const res = await fetch(`/api/precomputed?userId=${userId}`);
      const data = await res.json();
      setMatches(data.matches || []);
      setLoading(false);
    }
    fetchMatches();
  }, [userId]);

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
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-4xl mx-auto space-y-12">
        {matches.map((m) => {
          const {
            myPerspective = 0,
            theirPerspective = 0,
            iHaveWhatTheyWant = [],
            theyHaveWhatIWant = [],
            commonTraits = [],
          } = m.details || {};

          return (
            <div
              key={m.userId}
              className="bg-zinc-900 rounded-3xl p-8 shadow-2xl border border-zinc-800"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold">{m.username}</h2>
                <div className="text-right">
                  <div className="text-5xl font-extrabold text-green-400">
                    {m.totalCompatibility}%
                  </div>
                  <div className="text-sm text-gray-400">
                    overall compatibility
                  </div>
                </div>
              </div>

              {/* Compatibility Breakdown */}
              <div className="space-y-6 mb-8">
                <Bar
                  label="Character"
                  value={m.characterCompatibility}
                  color="bg-blue-500"
                />
                <Bar
                  label="Desire Alignment"
                  value={m.desiredCompatibility}
                  color="bg-purple-500"
                />
              </div>

              {/* Perspective */}
              <div className="grid grid-cols-2 gap-6 text-sm mb-8">
                <div className="bg-zinc-800 p-4 rounded-xl">
                  <p className="text-gray-400">You match their desires</p>
                  <p className="text-xl font-bold text-green-400">
                    {myPerspective}%
                  </p>
                </div>

                <div className="bg-zinc-800 p-4 rounded-xl">
                  <p className="text-gray-400">They match your desires</p>
                  <p className="text-xl font-bold text-green-400">
                    {theirPerspective}%
                  </p>
                </div>
              </div>

              {/* Shared Traits */}
              {commonTraits.length > 0 && (
                <TraitSection title="Shared Traits" traits={commonTraits} />
              )}

              {theyHaveWhatIWant.length > 0 && (
                <TraitSection
                  title="They have what you want"
                  traits={theyHaveWhatIWant}
                />
              )}

              {iHaveWhatTheyWant.length > 0 && (
                <TraitSection
                  title="You have what they want"
                  traits={iHaveWhatTheyWant}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Components ---------- */

function Bar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="font-semibold">{value}%</span>
      </div>
      <div className="w-full bg-zinc-800 rounded-full h-3">
        <div
          className={`${color} h-3 rounded-full transition-all duration-700`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function TraitSection({ title, traits }: { title: string; traits: string[] }) {
  return (
    <div className="mb-6">
      <h3 className="text-gray-400 text-sm mb-3">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {traits.map((trait, i) => (
          <span
            key={i}
            className="px-3 py-1 text-sm bg-zinc-800 rounded-full border border-zinc-700"
          >
            {trait}
          </span>
        ))}
      </div>
    </div>
  );
}
