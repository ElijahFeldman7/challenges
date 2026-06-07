"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useRef } from "react";

function ChallengeContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "Challenge";
  const timerString = searchParams.get("time") || "60s";
  
  const [loading, setLoading] = useState(true);
  const [challengeData, setChallengeData] = useState<any>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  
  const [timeLeft, setTimeLeft] = useState(parseInt(timerString.replace('s', '')));
  const [blurs, setBlurs] = useState(0);
  const [userCode, setUserCode] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [gradingResult, setGradingResult] = useState<{isCorrect: boolean, explanation: string} | null>(null);

  const blurCountRef = useRef(0);

  const fetchedRef = useRef(false);

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    fetch('/api/challenges/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeType: type }),
    })
    .then(res => res.json())
    .then(data => {
      setChallengeData(data.challenge);
      setUserCode(data.challenge.code);
      setAttemptId(data.attemptId);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [status, type]);

  useEffect(() => {
    if (loading || submitted) return;

    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(interval);
          submitAnswer(userCode, true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        blurCountRef.current += 1;
        setBlurs(blurCountRef.current);
      }
    };

    const handleBlur = () => {
      blurCountRef.current += 1;
      setBlurs(blurCountRef.current);
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
    };
  }, [loading, submitted, userCode]);

  const submitAnswer = async (finalAnswer: string, autoSubmit = false) => {
    if (submitted) return;
    setSubmitted(true);
    setLoading(true);
    
    try {
      const res = await fetch('/api/challenges/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          answer: finalAnswer,
          blurs: blurCountRef.current,
          timeLeft
        }),
      });
      const data = await res.json();
      setGradingResult({ isCorrect: data.isCorrect, explanation: data.explanation });
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (status === "loading") return <div className="p-8 text-center bg-neutral-900 text-white h-screen">Loading...</div>;
  if (!session) return <div className="p-8 text-center h-screen bg-neutral-900 text-white">Please login first.</div>;

  if (submitted && !loading && gradingResult) {
    return (
      <div className="flex-1 flex flex-col bg-neutral-900 text-neutral-100 h-full min-h-screen">
        <main className="max-w-3xl w-full mx-auto p-6 mt-12 font-mono">
          <div className={`p-6 border ${gradingResult.isCorrect ? 'border-green-500 text-green-400' : 'border-red-500 text-red-400'} mb-6`}>
            <h2 className="text-2xl font-bold mb-4 uppercase">
              {gradingResult.isCorrect ? "Correct" : "Incorrect"}
            </h2>
            <p className="text-neutral-300">{gradingResult.explanation}</p>
          </div>
          
          <div className="text-neutral-400 mb-8 space-y-2">
            <p>Tab off-focus events: {blurs}</p>
          </div>
          
          <button 
            onClick={() => window.location.href = '/'}
            className="px-6 py-2 border border-neutral-500 hover:bg-neutral-800 transition-colors uppercase text-sm font-bold tracking-wider"
          >
            Return
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-neutral-900 text-neutral-100 font-mono">
      <div className="flex items-center justify-between p-4 border-b border-neutral-800">
        <div className="font-bold">{type}</div>
        <div className="flex gap-6 items-center">
          <div className="text-neutral-100 text-xl">
            00:{timeLeft.toString().padStart(2, '0')}
          </div>
          {blurs > 0 && (
            <div className="text-xs border border-neutral-500 px-2 py-1">
              Blurs: {blurs}
            </div>
          )}
        </div>
      </div>

      <main className="flex-1 flex flex-col w-full p-0">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin w-6 h-6 border-2 border-neutral-700 border-t-neutral-300"></div>
          </div>
        ) : (
          <div className="flex flex-col h-full flex-1">
            <div className="p-4 bg-neutral-900 text-neutral-400 text-sm border-b border-neutral-800">
              Fix the bug in the code below directly.
            </div>
            <textarea 
              className="flex-1 w-full bg-neutral-900 text-neutral-200 p-6 font-mono text-sm outline-none resize-none"
              style={{ fontVariantLigatures: 'none', fontFeatureSettings: '"calt" 0' }}
              value={userCode}
              onChange={(e) => setUserCode(e.target.value)}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              data-gramm="false"
              autoFocus
            />
            <div className="p-4 border-t border-neutral-800 flex justify-end items-center gap-4">
              <div className="text-xs text-neutral-500 mr-auto bg-neutral-800 p-2 rounded">
                <span className="font-bold text-neutral-400 uppercase tracking-widest text-[10px]">Demo Panel:</span><br/>
                Expected Bug/Fix: <span className="text-neutral-300">{challengeData?.answer}</span>
              </div>
              <button 
                onClick={() => submitAnswer(userCode)}
                className="px-8 py-2 bg-neutral-100 text-neutral-900 font-bold hover:bg-white transition-colors"
              >
                SUBMIT
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ChallengePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center bg-neutral-900 text-white h-screen">Loading...</div>}>
      <ChallengeContent />
    </Suspense>
  );
}