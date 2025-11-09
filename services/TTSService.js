import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(path.join(__filename, '..')); // Go up one level to project root
const publicDir = path.join(__dirname, 'public', 'prompts');

// Ensure the directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

class TTSService {
  constructor(apiKey) {
    this.client = new ElevenLabsClient({
      apiKey: apiKey,
    });
  }

  async generateVoice(text, customerId) {
    const filename = `prompt_${customerId}_${Date.now()}.mp3`;
    const filepath = path.join(publicDir, filename);

    try {
      // 1. Get the audio stream
      const audio = await this.client.textToSpeech.convert("21m00Tcm4TlvDq8ikWAM", { // Voice ID for "Rachel"
        text: text,
        model_id: 'eleven_multilingual_v2',
      });

      // 2. Collect the stream's chunks into an array
      // 'audio' is a Web API ReadableStream, which is an async iterable
      const chunks = [];
      for await (const chunk of audio) {
        chunks.push(chunk);
      }

      // 3. Concatenate the chunks into a single Buffer
      const content = Buffer.concat(chunks);

      // 4. Write the complete Buffer to the file
      fs.writeFileSync(filepath, content);

      // 5. Return the public URL
      return `${process.env.BASE_URL}/public/prompts/${filename}`;

    } catch (err) {
      console.error('ElevenLabs error:', err);
      throw new Error('Failed to generate voice prompt.');
    }
  }
}

export default TTSService;