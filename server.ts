import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API routes FIRST
  app.post("/api/estimate-calories", async (req, res) => {
    try {
      const { messages } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API key not configured" });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const systemInstruction = `You are a calorie estimation assistant. 
Your goal is to accurately estimate the calories in a user's meal.
If the user provides enough detail (ingredients and approximate quantities), calculate the calories and respond with JSON:
{
  "status": "complete",
  "calories": <integer>,
  "title": "<short descriptive name for the meal>",
  "message": "<breakdown of calories and nutritional reasoning>"
}

If the user's description is too vague (e.g. "I ate pizza" or "chicken and rice"), ask a follow-up question to clarify quantities, sizes, or specific ingredients. Respond with JSON:
{
  "status": "incomplete",
  "message": "<your brief follow-up question>"
}

Always respond strictly in JSON matching one of these schemas. Do not use markdown formatting outside the JSON.`;

      const contents = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.2
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from Gemini");

      const result = JSON.parse(text);
      res.json(result);

    } catch (error) {
      console.error("Gemini Error:", error);
      res.status(503).json({ error: "The AI Coach is currently taking a break. Please try again in a few moments." });
    }
  });

  app.post("/api/define-goal", async (req, res) => {
    try {
      const { messages } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API key not configured" });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const systemInstruction = `You are an elite, highly motivational fitness and nutrition AI coach. Your goal is to help the user define their fitness objective.
Ask questions to understand their current lifestyle, habits, and what they want to achieve.
Once you have enough information to categorize their goal into one of three categories ("Lose Weight", "Maintain", or "Build Muscle"), respond with JSON:
{
  "status": "complete",
  "goal": "<Lose Weight | Maintain | Build Muscle>",
  "message": "<A highly motivational, positive, and judgment-free message summarizing their goal and hyping them up!>"
}
If you still need more information (e.g. they just said "I want to look better" and you need to know if they want to lose fat or build muscle, or they haven't shared enough), ask a follow-up question. Respond with JSON:
{
  "status": "incomplete",
  "message": "<your brief, motivational follow-up question>"
}
Always respond strictly in JSON matching one of these schemas. Do not use markdown formatting outside the JSON. Keep your questions short and conversational.`;

      const contents = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.7
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from Gemini");

      const result = JSON.parse(text);
      res.json(result);
    } catch (error) {
      console.error("Gemini Error:", error);
      res.status(503).json({ error: "The AI Coach is currently taking a break. Please try again in a few moments." });
    }
  });

  app.post("/api/scan-food", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API key not configured" });
      }

      if (!imageBase64) {
         return res.status(400).json({ error: "No image provided" });
      }

      // Remove data URI prefix if present
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const systemInstruction = `You are a calorie estimation assistant. 
Analyze the image of food or a food label.
Calculate or estimate the calories and macros if possible, and respond with JSON:
{
  "status": "complete",
  "calories": <integer>,
  "title": "<short descriptive name for the food>",
  "message": "<breakdown of calories and nutritional reasoning>"
}
If you cannot identify any food, respond with status "error" and a message.
Always respond strictly in JSON matching this schema.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user', 
            parts: [
              { text: "Analyze this food and estimate its calories." },
              { inlineData: { data: base64Data, mimeType: 'image/jpeg' } }
            ]
          }
        ],
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.2
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from Gemini");

      const result = JSON.parse(text);
      res.json(result);

    } catch (error) {
      console.error("Gemini Scan Error:", error);
      res.status(503).json({ error: "The AI Coach couldn't process the image right now." });
    }
  });

  app.post("/api/analyze-progress", async (req, res) => {
    try {
      const { beforeImageBase64, afterImageBase64, beforeDate, afterDate, beforeWeight, afterWeight, userGoal } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API key not configured" });
      }

      if (!beforeImageBase64 || !afterImageBase64) {
        return res.status(400).json({ error: "Both before and after photos are required for AI comparison." });
      }

      const cleanBeforeBase64 = beforeImageBase64.replace(/^data:image\/\w+;base64,/, "");
      const cleanAfterBase64 = afterImageBase64.replace(/^data:image\/\w+;base64,/, "");

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const systemInstruction = `You are an elite sports physiologist, biomechanics coach, and body transformation expert.
Analyze the two user progress photos: Image 1 is "BEFORE" (${beforeDate || 'Starting Point'}, Weight: ${beforeWeight ? beforeWeight + ' kg' : 'N/A'}), Image 2 is "AFTER" (${afterDate || 'Current Progress'}, Weight: ${afterWeight ? afterWeight + ' kg' : 'N/A'}).
The user's primary fitness goal is: ${userGoal || 'Fitness & Body Recomposition'}.

Provide a motivating, highly scientific, accurate, and supportive comparative breakdown of their physical progression.

You MUST respond strictly with valid JSON conforming to this schema:
{
  "status": "complete",
  "summary": "<2-3 inspiring and clear sentences describing the overall physical transformation observed>",
  "consistencyRating": "<e.g., 'Elite Consistency (Top Tier)', 'Outstanding Progress', 'Steady Transformation'>",
  "highlights": [
    "<Highlight 1: Specific visible muscle tone or tightness observed in upper body / core / posture>",
    "<Highlight 2: Specific leanness / body composition / waistline change>",
    "<Highlight 3: Alignment, shoulder posture, or symmetry enhancement>"
  ],
  "physiqueObservations": {
    "muscleDefinition": "<2-3 sentences evaluating visible muscle tone, vascularity, and shape>",
    "bodyComposition": "<2-3 sentences assessing body fat distribution, waist/hip taper, and firmness>",
    "postureAndForm": "<2-3 sentences on spinal alignment, shoulder retraction, and chest elevation>"
  },
  "coachFeedback": "<A paragraph of direct, encouraging feedback celebrating their dedication and discipline>",
  "nextMilestoneAdvice": [
    "<Actionable training advice for the next 30 days>",
    "<Actionable nutrition / recovery optimization tip for the next 30 days>"
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: `Compare these two progress photos for my transformation analysis. Date 1 (${beforeDate || 'Start'}): ${beforeWeight ? beforeWeight + 'kg' : ''}. Date 2 (${afterDate || 'Now'}): ${afterWeight ? afterWeight + 'kg' : ''}. Goal: ${userGoal || 'Fitness'}.` },
              { inlineData: { data: cleanBeforeBase64, mimeType: 'image/jpeg' } },
              { inlineData: { data: cleanAfterBase64, mimeType: 'image/jpeg' } }
            ]
          }
        ],
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.3
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from Gemini");

      const result = JSON.parse(text);
      res.json(result);
    } catch (error) {
      console.error("Gemini Progress Analysis Error:", error);
      res.status(503).json({ 
        error: "AI Progress analysis is currently taking a moment. Please try again in a few seconds." 
      });
    }
  });

  app.post("/api/daily-tip", async (req, res) => {
    try {
      const { goal } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API key not configured" });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const systemInstruction = `You are an elite fitness and nutrition coach. Your goal is to provide a short, actionable, and highly motivational tip for the day.
The user's primary goal is: ${goal || 'General Fitness'}.
Respond with JSON:
{
  "tip": "<A short 1-2 sentence tip>"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [{ role: 'user', parts: [{ text: "Give me today's daily tip." }] }],
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.8
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response from Gemini");

      const result = JSON.parse(text);
      res.json(result);
    } catch (error) {
      console.error("Gemini Error:", error);
      res.json({ tip: "Stay consistent and trust the process. Every small step counts towards your goal!" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
