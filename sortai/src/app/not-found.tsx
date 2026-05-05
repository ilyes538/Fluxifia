import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-8xl font-bold text-purple-500">404</h1>
        <p className="text-xl text-gray-400 mt-4">Page introuvable</p>
        <Link href="/" className="mt-6 inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition">
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
