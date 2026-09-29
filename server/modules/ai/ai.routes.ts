import { GoogleGenAI } from '@google/genai';
import { Router } from 'express';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { validate } from '../../middleware/validate.js';
import { AppError, ServiceUnavailableError } from '../../shared/app-error.js';
import { asyncHandler } from '../../shared/async-handler.js';

const plannerSchema = z.object({
  destination: z.string().trim().min(2).max(120),
  budget: z.coerce.number().positive().max(100_000_000),
  duration: z.coerce.number().int().min(1).max(30),
  travelers: z.coerce.number().int().min(1).max(50).default(1),
  interests: z.string().trim().max(500).optional(),
});

let aiClient: GoogleGenAI | null = null;

function getAiClient() {
  if (!env.GEMINI_API_KEY) {
    throw new ServiceUnavailableError('AI planning is not configured.');
  }
  aiClient ??= new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  return aiClient;
}

export const aiRouter = Router();
export const legacyAiRouter = Router();

const plannerValidation = validate('body', plannerSchema);
const plannerHandler = asyncHandler(async (request, response) => {
    const { destination, budget, duration, travelers, interests } = request.body;
    const ai = getAiClient();
    const result = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Create a practical ${duration}-day Pakistan itinerary for ${travelers} traveler(s) visiting ${destination}. The total budget is PKR ${budget}. Interests: ${interests || 'sightseeing, nature, and local food'}. Clearly distinguish suggestions from confirmed availability.`,
      config: {
        systemInstruction: 'You are the GBBookings travel planner. Give concise day-by-day guidance. Never claim live price or availability unless supplied by the marketplace API.',
        temperature: 0.6,
      },
    });

    if (!result.text) {
      throw new AppError(502, 'AI_EMPTY_RESPONSE', 'The AI provider returned an empty response.');
    }

    response.json({ itinerary: result.text });
});

aiRouter.post('/planner', plannerValidation, plannerHandler);
legacyAiRouter.post('/', plannerValidation, plannerHandler);
