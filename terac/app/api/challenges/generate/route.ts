import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';

const apiKey = process.env.REACT_APP_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { challengeType } = body;

    let fallback = false;
    let challengeContent = null;

    if (challengeType === 'Bug') {
      challengeContent = {
        code: "function calculateTotal(items) {\n  let total = 0;\n  for(let i = 0; i <= items.length; i++) {\n    total += items[i].price;\n  }\n  return total;\n}",
        answer: "Index out of bounds mapping (<= items.length should be < items.length)",
        language: "javascript"
      };
    } else {
      try {
        const existingAttempts = await prisma.challengeAttempt.findMany({
          where: { challenge_type: challengeType },
          select: { ai_generated_content: true }
        });
        const uniqueContents = Array.from(new Set(existingAttempts.map(a => a.ai_generated_content)));

        if (uniqueContents.length >= 10) {
          const randomStr = uniqueContents[Math.floor(Math.random() * uniqueContents.length)];
          challengeContent = JSON.parse(randomStr);
        } else {
          const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 
          
          let prompt = "";
          if (challengeType === 'Efficiency') {
              prompt = `Generate a short function (under 15 lines) containing a performance bottleneck (e.g., O(N^2) or nested loops).
              Return ONLY JSON in the following format, with no markdown formatting around it:
              {
                "code": "the code text here",
                "answer": "explanation of the bottleneck",
                "language": "python"
              }`;
          } else if (challengeType === 'Check Logs') {
              prompt = `Generate a terminal log showing a git disaster (e.g. wiped branches).
              Return ONLY JSON in the following format, with no markdown formatting around it:
              {
                "code": "the terminal logs",
                "answer": "git reflog ...",
                "language": "bash"
              }`;
          } else {
              prompt = `Generate a random 10-line coding puzzle.
              Return ONLY JSON in the following format, with no markdown formatting around it:
              {
                "code": "code",
                "answer": "answer explanation",
                "language": "javascript"
              }`;
          }

          const result = await model.generateContent(prompt);
          const responseText = result.response.text();
          
          const cleanJsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
          challengeContent = JSON.parse(cleanJsonStr);
        }
      } catch (aiError) {
        console.error("AI Error:", aiError);
        fallback = true;
        challengeContent = {
          code: "function calculateTotal(items) {\n  let total = 0;\n  for(let i = 0; i <= items.length; i++) {\n    total += items[i].price;\n  }\n  return total;\n}",
          answer: "Index out of bounds mapping (<= items.length should be < items.length)",
          language: "javascript"
        };
      }
    }

    const attempt = await prisma.challengeAttempt.create({
      data: {
        userId: (session.user as any).id,
        challenge_type: challengeType,
        ai_generated_content: JSON.stringify(challengeContent),
        start_time: new Date(),
      }
    });

    return NextResponse.json({
      attemptId: attempt.id,
      challenge: challengeContent,
      fallback
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
