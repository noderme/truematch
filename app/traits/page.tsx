"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function TraitsPage() {
  const [traits, setTraits] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get("userId");

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    fetch(`/api/traits?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => setTraits(data.traits || []))
      .finally(() => setLoading(false));
  }, [userId]);

  const toggleTrait = (trait: string) => {
    setSelected((prev) =>
      prev.includes(trait) ? prev.filter((t) => t !== trait) : [...prev, trait],
    );
  };

  const matchPercent = traits.length
    ? Math.floor((selected.length / traits.length) * 100)
    : 0;

  return (
    <div className="min-h-screen p-6 flex flex-col items-center bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Select traits you value
      </h1>

      {loading && <p className="mb-4 text-gray-500">Loading traits…</p>}

      {!loading && traits.length === 0 && (
        <p className="mb-4 text-red-500 text-center">
          No traits found for this user.
        </p>
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        {traits.map((trait) => (
          <button
            key={trait}
            onClick={() => toggleTrait(trait)}
            className={`px-5 py-2 rounded-full border font-medium transition-colors duration-200 ${
              selected.includes(trait)
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
            }`}
          >
            {trait}
          </button>
        ))}
      </div>

      <p className="mb-4 text-lg font-semibold">
        Match Progress: {matchPercent}%
      </p>

      {matchPercent >= 75 && (
        <button
          onClick={() => router.push(`/match?userId=${userId}`)}
          className="px-8 py-3 bg-green-500 text-white rounded-lg text-lg font-bold hover:bg-green-600 transition-colors"
        >
          Proceed to Match
        </button>
      )}
    </div>
  );
}
