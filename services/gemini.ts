import { GoogleGenAI, Modality, Type } from "@google/genai";
import { LessonContent } from "../types";
import { decode, decodeAudioData, playAudioBuffer } from "./audioUtils";

// Audio Context Singleton
let audioContext: AudioContext | null = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

function getAiClient() {
  // Ensure API Key is present; environment handling logic is external but usage is here
  if (!process.env.API_KEY) {
    console.error("API_KEY is missing");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
}

/**
 * Generates a structured English lesson for primary school students.
 */
export const generateLesson = async (topic: string): Promise<LessonContent> => {
  const ai = getAiClient();
  const prompt = `Create a fun and engaging English lesson for a primary school student about "${topic}".
  The response must be in valid JSON format.
  Structure the content to include:
  1. A Title.
  2. A short, friendly Introduction in Chinese explaining the topic.
  3. A list of 3-5 key Vocabulary words (English word, Chinese translation, and a simple English example sentence).
  4. A short Story (3-5 sentences) using the vocabulary in English.
  5. A mini Quiz with 2 multiple choice questions (question in Chinese/English mix, 3 options, and the correct answer string).
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          introduction: { type: Type.STRING },
          vocabulary: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                translation: { type: Type.STRING },
                example: { type: Type.STRING },
              },
            },
          },
          story: { type: Type.STRING },
          quiz: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                answer: { type: Type.STRING },
              },
            },
          },
        },
      },
    },
  });

  if (response.text) {
    try {
      const parsed = JSON.parse(response.text);
      // Defensive coding: ensure all required fields exist to prevent runtime errors
      return {
        title: parsed.title || "Untitled Lesson",
        introduction: parsed.introduction || "Welcome to your lesson!",
        vocabulary: Array.isArray(parsed.vocabulary) ? parsed.vocabulary : [],
        story: parsed.story || "Let's learn together!",
        quiz: Array.isArray(parsed.quiz) ? parsed.quiz : [],
      };
    } catch (error) {
      console.error("Failed to parse JSON:", response.text, error);
      throw new Error("Invalid lesson format received");
    }
  }
  throw new Error("Failed to generate lesson content");
};

/**
 * Converts text to speech using Gemini TTS
 */
export const playTextToSpeech = async (text: string) => {
  try {
    const ai = getAiClient();
    const ctx = getAudioContext();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Female voice, clear
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (base64Audio) {
      const audioBuffer = await decodeAudioData(
        decode(base64Audio),
        ctx,
        24000,
        1
      );
      await playAudioBuffer(audioBuffer, ctx);
    }
  } catch (error) {
    console.error("TTS Error:", error);
    // Don't alert on TTS failure to avoid disrupting the flow too much, just log it
  }
};

/**
 * Chat functionality
 */
export const sendChatMessage = async (history: { role: string; parts: { text: string }[] }[], newMessage: string): Promise<string> => {
  const ai = getAiClient();
  const chat = ai.chats.create({
    model: "gemini-2.5-flash",
    history: history,
    config: {
      systemInstruction: "You are a friendly, patient, and helpful primary school English teacher named 'Star Teacher'. You answer questions in a mix of simple English and Chinese to help the student understand. Keep answers concise and encouraging.",
    },
  });

  const result = await chat.sendMessage({ message: newMessage });
  return result.text || "Sorry, I didn't catch that.";
};
