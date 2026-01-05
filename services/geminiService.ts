import { GoogleGenAI, Modality } from "@google/genai";
import { LandmarkData, GroundingChunk } from "../types";

// Initialize the client
// Using a getter to ensure we pick up the key if it's set later or if environment changes (though mostly static here)
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Step 1: Identify the landmark from the image using gemini-3-pro-preview.
 */
export const identifyLandmark = async (base64Image: string, mimeType: string): Promise<{ name: string; visualDescription: string }> => {
  const ai = getAiClient();
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: "Identify this famous landmark. Return ONLY the name of the landmark on the first line, and a very short (1 sentence) visual description on the second line.",
          },
        ],
      },
    });

    const text = response.text || "";
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const name = lines[0]?.trim() || "Unknown Landmark";
    const visualDescription = lines[1]?.trim() || "A recognized structure.";

    return { name, visualDescription };
  } catch (error) {
    console.error("Vision Error:", error);
    throw new Error("Could not identify the landmark.");
  }
};

/**
 * Step 2: Fetch history and fun facts using gemini-3-flash-preview with Google Search.
 */
export const fetchLandmarkHistory = async (landmarkName: string): Promise<{ history: string; sources: { uri: string; title: string }[] }> => {
  const ai = getAiClient();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Tell me the interesting history and a few fun facts about ${landmarkName}. Keep it concise (approx 100 words), engaging, and written like a tour guide script.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    // Extract text
    const history = response.text || "No history found.";

    // Extract grounding sources
    const sources: { uri: string; title: string }[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] | undefined;
    
    if (chunks) {
      chunks.forEach(chunk => {
        if (chunk.web) {
          sources.push({
            uri: chunk.web.uri,
            title: chunk.web.title,
          });
        }
      });
    }

    // De-duplicate sources
    const uniqueSources = sources.filter((v, i, a) => a.findIndex(t => t.uri === v.uri) === i);

    return { history, sources: uniqueSources };
  } catch (error) {
    console.error("Search Error:", error);
    throw new Error("Could not fetch history.");
  }
};

// Helper: Decode Base64 string to Uint8Array
const decodeBase64 = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Helper: Convert Raw PCM to AudioBuffer
const pcmToAudioBuffer = (
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): AudioBuffer => {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};

/**
 * Step 3: Generate speech from the history text using gemini-2.5-flash-preview-tts.
 */
export const generateNarration = async (text: string): Promise<AudioBuffer> => {
  const ai = getAiClient();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // 'Kore' is usually a good, clear voice
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data returned");
    }

    // Decode PCM data
    const pcmData = decodeBase64(base64Audio);
    
    // Create a temporary AudioContext to manufacture the buffer
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Gemini audio is typically 24kHz, 1 channel
    const audioBuffer = pcmToAudioBuffer(pcmData, audioContext, 24000, 1);
    
    return audioBuffer;

  } catch (error) {
    console.error("TTS Error:", error);
    throw new Error("Could not generate speech.");
  }
};
