import { GoogleGenAI } from "@google/genai";
import axios from 'axios';

class TranscriptionService {
  constructor() {
    this.client = new GoogleGenAI({});
  }

  async transcribeAudio(url) {
    // For simplicity, we can download the recording and send it to Gemini
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const audioBuffer = Buffer.from(response.data, 'binary');

    const transcript = await this.client.audioTranscription(audioBuffer);
    return transcript;
  }

  async analyzeSentiment(transcript) {
    const prompt = `Classify this text as "good", "neutral", or "bad": "${transcript}"`;
    const result = await this.client.chatCompletion(prompt);
    return result.trim().toLowerCase(); // ensures it's one of the three
  }
}

export default TranscriptionService;
