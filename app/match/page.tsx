"use client";
import { useSearchParams } from "next/navigation";
import MatchClient from "./MatchClient";

export default function MatchPage() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 max-w-md w-full text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
            Oops!
          </h1>
          <p className="text-gray-600 text-base sm:text-lg mb-6">
            User ID is missing. Please sign up first to continue.
          </p>
          <a
            href="/"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-base"
          >
            Go to Sign Up
          </a>
        </div>
      </div>
    );
  }

  return <MatchClient userId={userId} />;
}
