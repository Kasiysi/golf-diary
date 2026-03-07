import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full text-center space-y-10">
        <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-semibold text-[var(--heading)] tracking-tight">
          Golf Diary
        </h1>
        <p className="text-[var(--muted-foreground)] text-base sm:text-lg max-w-md mx-auto">
          Your professional practice journal. Feels, problems, drills, and coach notes—all in one place.
        </p>
        <Link
          href="/diary"
          className="inline-flex items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--accent-foreground)] font-medium px-8 py-3.5 text-lg shadow-[var(--shadow-md)] hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 transition-opacity"
        >
          Enter Your Diary
        </Link>
      </div>
    </div>
  );
}
