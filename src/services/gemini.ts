import { GoogleGenAI, Type } from '@google/genai';

export interface Highlight {
  textToHighlight: string;
  color: 'green' | 'yellow' | 'red';
  before: string;
  after: string;
  explanation: string;
}

export interface ResumeAnalysis {
  atsScore: number;
  executiveConclusion: string;
  mustFixItems: string[];
  highlights: Highlight[];
}

export async function analyzeResume(resumeText: string): Promise<ResumeAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: `Analyze the following resume text and provide a "Top 1% Resume Optimizer" analysis.

Resume Text:
${resumeText}

Instructions:
1. Calculate an ATS Score (0-100) based on keyword density, formatting, and industry standards.
2. Provide a "Brutal Honesty" Executive Conclusion: a candid, critical summary of the candidate's marketability.
3. Identify exactly 3 "Must-Fix" priority items.
4. Identify specific lines or phrases in the text to highlight. For each highlight, provide:
   - textToHighlight: The EXACT substring from the resume text (must match exactly).
   - color: "green" (high-impact, quantifiable achievements), "yellow" (minor issues like "too wordy"), or "red" (critical errors like "missing contact info", "weak action verbs").
   - before: The original text (or a summary of the issue if it's a missing thing).
   - after: A suggested improvement.
   - explanation: A brief explanation of the "why" based on elite recruiting practices.
   
Ensure the highlights cover a mix of green, yellow, and red items if applicable. Keep the textToHighlight relatively short (a sentence or phrase) so it can be easily found in the text.`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          atsScore: { type: Type.INTEGER, description: 'ATS Score from 0 to 100' },
          executiveConclusion: { type: Type.STRING, description: 'Candid, critical summary' },
          mustFixItems: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Exactly 3 priority items to fix'
          },
          highlights: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                textToHighlight: { type: Type.STRING, description: 'Exact substring from the resume text to highlight' },
                color: { type: Type.STRING, enum: ['green', 'yellow', 'red'], description: 'Highlight color' },
                before: { type: Type.STRING, description: 'Original text or issue description' },
                after: { type: Type.STRING, description: 'Suggested improvement' },
                explanation: { type: Type.STRING, description: 'Explanation based on elite recruiting practices' }
              },
              required: ['textToHighlight', 'color', 'before', 'after', 'explanation']
            }
          }
        },
        required: ['atsScore', 'executiveConclusion', 'mustFixItems', 'highlights']
      }
    }
  });

  const jsonStr = response.text?.trim() || '{}';
  try {
    return JSON.parse(jsonStr) as ResumeAnalysis;
  } catch (e) {
    console.error('Failed to parse JSON response', jsonStr);
    throw new Error('Failed to parse analysis results.');
  }
}
