"use client";

import { useSession, signIn } from "next-auth/react";
import Image from "next/image";
import { Navbar } from "./components/Navbar";
import { useRouter } from "next/navigation";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white p-6">
        <div className="bg-white p-8 border border-neutral-200 max-w-sm w-full text-center flex flex-col items-center">
          <Image src="/favicon.ico" alt="Terac Logo" width={64} height={64} className="mb-4" unoptimized />
          <h1 className="text-2xl text-neutral-900 font-bold mb-1">Terac</h1>
          <p className="text-neutral-500 mb-8">Technical Challenge</p>
          
          <button 
            onClick={() => signIn("google")}
            className="w-full bg-neutral-900 text-white py-2.5 font-medium hover:bg-neutral-800 transition-colors flex items-center justify-center gap-3"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor"/>
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      <Navbar />
      <main className="max-w-5xl w-full mx-auto p-6 md:p-12">
        <h2 className="text-3xl font-bold mb-2 text-neutral-900">Available Challenges</h2>
        <p className="text-neutral-500 mb-8">Select a technical challenge to begin. tab switching is tracked.</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ChallengeCard 
            title="Bug" 
            timeLimit="60s"
          />
          <ChallengeCard 
            title="Efficiency" 
            timeLimit="45s"
          />
          <ChallengeCard 
            title="Check Logs" 
            timeLimit="45s"
          />
        </div>
      </main>
    </div>
  );
}

function ChallengeCard({ title, timeLimit }: { title: string, timeLimit: string }) {
  const router = useRouter();

  const startChallenge = () => {
    router.push(`/challenge?type=${encodeURIComponent(title)}&time=${encodeURIComponent(timeLimit)}`);
  };

  return (
    <div 
      onClick={startChallenge}
      className="bg-white border border-neutral-200 p-6 hover:bg-neutral-50 transition-colors flex flex-col justify-between cursor-pointer"
    >
      <div>
        <h3 className="font-bold text-lg mb-6 text-neutral-900">{title}</h3>
      </div>
      <button className="text-sm font-medium text-neutral-900 hover:text-black self-start text-left">
        Start &rarr;
      </button>
    </div>
  );
}
