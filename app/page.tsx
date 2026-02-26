// app/page.tsx
import Link from "next/link";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4">
      <h1 className="text-3xl font-bold mb-4">AI Match</h1>
      <Link href="/signup">
        <button className="px-6 py-3 bg-blue-500 text-white rounded-lg text-lg">
          Get Started
        </button>
      </Link>
    </div>
  );
}
