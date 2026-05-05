"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-400">Une erreur est survenue</h1>
        <p className="text-gray-400 mt-4">{error.message}</p>
        <button
          onClick={reset}
          className="mt-6 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
