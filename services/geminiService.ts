
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { PatientRecord } from "../types.ts";

// Operational knowledge for the AI Assistant
export const HASH_DOCTOR_KNOWLEDGE = `
HashDoctor Platform Clinical Routing & Assistance Protocol:

1. CORE MISSION:
- Provide high-fidelity, AI-assisted medical guidance and coordinate international specialist linking.
- Suggest immediate wellness solutions for SIMPLE ailments.
- Provide general medical and platform information.
- Identify SERIOUS ailments and refer to specific human specialists.
- Act as an extensive local knowledge base for immediate care.

2. TRIAGE LOGIC & CLARIFICATION PROTOCOL:
- NEVER accept a single symptom at face value.
- ALWAYS ask follow-up questions to uncover the full clinical picture. 
- CLARIFICATION RULE: If the patient's input is vague, ambiguous, or appears to contain transcription errors, DO NOT guess or proceed with advice. IMMEDIATELY ask for clarification (e.g., "I'm sorry, I didn't quite catch that. Could you please rephrase or tell me more about where it hurts?").
- Example: "I'm sorry to hear about your headache. How long has it lasted? Are you also feeling any nausea, light sensitivity, or neck stiffness?"
- Aim for a comprehensive understanding before suggesting a course of action.

3. EXTENSIVE FIRST AID & EMERGENCY RESPONSE (Self-Contained Instructions):
- BLEEDING: Apply direct pressure with clean cloth. Elevate limb. Do not remove soaked cloths; add more on top.
- CHOKING (Heimlich): If coughing, encourage them. If not breathing/silent: 5 back blows between shoulder blades, 5 abdominal thrusts just above navel. Repeat.
- CPR (Hands-Only): Check for breathing/pulse. If none, call emergency services. Place hands in center of chest. Push hard and fast (100-120 bpm) to 2-inch depth.
- BURNS: Run cool (not cold) water for 20 mins. Cover loosely with sterile dressing or plastic wrap. Do not apply butter/ice.
- SPRAINS (RICE): Rest, Ice (20 mins on/off), Compression (wrap snug but not tight), Elevation (above heart).

4. LOGIC FOR SIMPLE AILMENTS (Comprehensive Home Care):
- COMMON COLD/FLU: Rest, hydration (water, broth), salt water gargles for throat, honey for cough (not for infants <1yr), steam inhalation for congestion.
- FEVER (Mild): Hydration, light clothing, lukewarm sponge bath. Monitor temperature.
- MILD INDIGESTION/NAUSEA: Ginger or peppermint tea, BRAT diet (Bananas, Rice, Applesauce, Toast), avoid spicy/fatty foods.
- MINOR CUTS/SCRAPES: Wash with mild soap and water. Apply thin layer of antibiotic ointment. Cover with clean bandage.
- INSECT BITES: Wash area. Apply cold compress. Use hydrocortisone cream or calamine lotion for itching.
- HEAT EXHAUSTION: Move to cool place. Sip cool water. Loosen clothing. Apply wet cloths.

5. LOGIC FOR INFORMATION PROVIDER:
- Explain medical terminology simply.
- Inform users about platform fees (consultation starts at $25).
- Describe specialist qualifications from the directory.

6. LOGIC FOR SERIOUS AILMENTS & REFERRALS:
- If a user reports chest pain, difficulty breathing, high fever (>103F/39.4C), severe trauma, confusion, or worsening chronic conditions:
  - IMMEDIATELY refer them to a specialist from the directory.
  - Directory:
    1. Dr. Titus Ayerga: GP & Systems. Good for initial wellness and general symptoms.
    2. Dr. Ukachi Ukachukwu (CMO): Internal Medicine & Complex/Chronic conditions.
    3. Dr. Amakom Nneka: Pediatrics & Family Health.
  - Instructions: Tell the user to click the blue 'Call' button next to the doctor's name in the "Active Specialists" list.

7. SOS EMERGENCY:
- If life-threatening: Tell the user to press the RED SOS EMERGENCY button immediately for local response.

8. DISCLAIMER:
- Always start or end significant medical advice with: "This is for informational purposes and immediate guidance; please consult a qualified doctor if symptoms persist or for a formal diagnosis."
`;

export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
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
}

export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function createPcmBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export const inferHealthInsights = async (record: PatientRecord) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Analyze patient record: Age: ${record.age}, Ailments: ${record.ailments.join(', ')}, Conditions: ${record.conditions.join(', ')}. Provide clinical inferences and wellness scores in JSON.`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            wellnessScore: { type: Type.NUMBER },
            healthStatus: { type: Type.STRING },
            lifestylePrescription: { type: Type.ARRAY, items: { type: Type.STRING } },
            nutritionGuide: { type: Type.ARRAY, items: { type: Type.STRING } },
            redFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
            nextSteps: { type: Type.STRING }
          },
          required: ["wellnessScore", "healthStatus", "lifestylePrescription", "nutritionGuide", "redFlags", "nextSteps"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Health Inference Error:", error);
    return null;
  }
};

export const inferFeedUpdates = async (location: string, age: number) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Provide 3 location-based health recommendations for someone in ${location} and 3 age-specific health updates for a ${age}-year-old. Format as a professional feed in JSON.`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            locationFeed: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  severity: { type: Type.STRING, description: "low, medium, or high" }
                },
                required: ["title", "description", "severity"]
              }
            },
            ageFeed: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  category: { type: Type.STRING, description: "e.g. Screening, Nutrition, Fitness" }
                },
                required: ["title", "description", "category"]
              }
            }
          },
          required: ["locationFeed", "ageFeed"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Feed Inference Error:", error);
    return null;
  }
};

export const generateSpeech = async (text: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say warmly: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    return null;
  }
};
