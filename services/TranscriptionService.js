import { GoogleGenerativeAI } from '@google/generative-ai';
import { SpeechClient } from '@google-cloud/speech';
import axios from 'axios';

class TranscriptionService {
  constructor() {
    this.geminiClient = new GoogleGenerativeAI(process.env.GEMINI_KEY);
    this.speechClient = new SpeechClient();
  }

  async transcribeAudio(url) {
    // 1. FIX: Append .wav to the URL to get the actual media file
    const downloadUrl = `${url}.wav`;
    console.log(`Downloading audio from: ${downloadUrl}`);

    // 2. FIX: Add 'auth' to the axios request
    const response = await axios.get(downloadUrl, {
      responseType: 'arraybuffer',
      auth: {
        username: process.env.TWILIO_SID,
        password: process.env.TWILIO_AUTH_TOKEN
      }
    });

    const audioBuffer = response.data;
    const audio = {
      content: audioBuffer.toString('base64'),
    };
    
    const config = {
      encoding: 'LINEAR16',
      sampleRateHertz: 8000,
      languageCode: 'en-US',
      model: 'phone_call',
    };
    
    const request = {
      audio: audio,
      config: config,
    };

    const [speechResponse] = await this.speechClient.recognize(request);
    const transcription = speechResponse.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');
      
    console.log(`Transcription: ${transcription}`);
    return transcription;
  }

  async analyzeSentiment(transcript) {
    const model = this.geminiClient.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `Classify the sentiment of this customer feedback as "good", "neutral", or "bad". Respond with only one of those three words. Feedback: "${transcript}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const sentiment = text.trim().toLowerCase().replace(/[^a-z]/g, '');
    
    console.log(`Sentiment: ${sentiment}`);
    return sentiment || 'neutral';
  }

  async generateImprovementInsight(text, sentiment) {
    // This prompt is specifically engineered to get actionable advice
    const prompt = `A T-Mobile customer's feedback has a '${sentiment}' sentiment. Based on their comment, provide one concise, actionable recommendation for T-Mobile to address their specific concern. Do not greet or sign off.

    Customer feedback: "${text}"
    
    Actionable recommendation:`;

    const model = this.geminiClient.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    console.log(`Generated insight for '${sentiment}' feedback.`);
    return response.text().trim();
  }
}

export default TranscriptionService;