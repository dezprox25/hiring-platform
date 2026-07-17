export interface EvaluationInputData {
  candidateName: string;
  roleApplied: string;
  mcq: {
    totalQuestions: number;
    correctAnswers: number;
    percentage: number;
    topicBreakdown: Record<
      string,
      { correct: number; total: number; percentage: number }
    >;
  };
  typing: {
    wpm: number;
    accuracy: number; // percentage 0–100
    timeTakenSeconds: number;
  };
  coding: {
    question: string;
    submittedCode: string;
    language: string;
    managerScore: number | null;
    managerReview: string | null;
  };
}

export function buildEvaluationPrompt(data: EvaluationInputData): {
  systemPrompt: string;
  userMessage: string;
} {
  const systemPrompt = `You are a technical hiring evaluator for Dezprox, a software company.
Analyse the candidate holistically: MCQ topic knowledge, typing speed + accuracy, and code quality.
Be objective, concise, and specific. Base all claims on the data provided.
CRITICAL: Respond ONLY with a valid JSON object. No markdown, no backticks, no preamble.

Required JSON response shape:
{
  "overallScore": number,          // overall 0–100
  "recommendation": "hire" | "reject" | "hold",
  "strengths": string[],          // 2–4 specific strengths
  "weaknesses": string[],         // 2–4 specific weaknesses
  "codingAnalysis": {
    "logic": number,              // 0-100
    "readability": number,        // 0-100
    "structure": number           // 0-100
  },
  "communicationAnalysis": {
    "clarity": number,            // 0-100
    "confidence": number          // 0-100
  },
  "summary": string               // 2–3 sentence overall summary
}`;

  const managerReview = data.coding.managerReview
    ? `Manager review: ${data.coding.managerReview}`
    : 'Manager review: Not yet provided';

  const userMessage = `Please evaluate the following candidate:

Candidate Name: ${data.candidateName}
Role Applied: ${data.roleApplied}

1. MCQ Results:
- Total Questions: ${data.mcq.totalQuestions}
- Correct Answers: ${data.mcq.correctAnswers}
- Percentage: ${data.mcq.percentage}%
- Topic Breakdown: ${JSON.stringify(data.mcq.topicBreakdown)}

2. Typing Test:
- WPM: ${data.typing.wpm}
- Accuracy: ${data.typing.accuracy}%
- Time Taken: ${data.typing.timeTakenSeconds} seconds

3. Coding Assessment:
- Question: ${data.coding.question}
- Language: ${data.coding.language}
- Submitted Code:
${data.coding.submittedCode}

${managerReview}
${data.coding.managerScore ? `Manager Coding Score: ${data.coding.managerScore}/100` : ''}

Provide your holistic evaluation in the required JSON format.`;

  return { systemPrompt, userMessage };
}
