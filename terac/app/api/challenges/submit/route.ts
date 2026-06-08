import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.REACT_APP_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { attemptId, answer, blurs, timeLeft } = body;

    const timeTaken = timeLeft ? parseInt(timeLeft) : 0; 
    
    const attemptRecord = await prisma.challengeAttempt.findUnique({
      where: { id: attemptId }
    });

    if (!attemptRecord) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    let isCorrect = false;
    let explanation = "Could not evaluate.";

    try {
      const challengeContent = JSON.parse(attemptRecord.ai_generated_content);
      const originalCode = challengeContent.code;
      const expectedAnswer = challengeContent.answer;

      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `You are a strict technical interviewer. 
      The original buggy code was:
      ${originalCode}

      The issue to fix was: ${expectedAnswer}

      The user submitted the following edited code:
      ${answer}

      Did the user successfully fix the bug without introducing new ones? 
      Return ONLY JSON in the following format, with no markdown formatting:
      {
        "isCorrect": boolean,
        "explanation": "Brief explanation of what they did right or wrong (1-2 sentences)"
      }`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const cleanJsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const grading = JSON.parse(cleanJsonStr);
      
      isCorrect = grading.isCorrect;
      explanation = grading.explanation;
    } catch (err) {
      console.error("Grading Error:", err);
    }

    const attempt = await prisma.challengeAttempt.update({
      where: { id: attemptId },
      data: {
        user_answer: answer,
        tab_blur_count: blurs,
        end_time: new Date(),
        time_taken_seconds: timeTaken,
        is_correct: isCorrect,
      }
    });

    return NextResponse.json({ success: true, isCorrect, explanation, attempt });
  } catch (error) {
    console.error("Submit Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
