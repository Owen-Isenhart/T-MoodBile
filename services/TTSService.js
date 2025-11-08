import fs from 'fs';
import elevenlabs from '@elevenlabs/elevenlabs-js';

class TTSService {
  constructor(apiKey) {
    this.client = new elevenlabs(apiKey);
  }

  async generateVoice(text, filename = 'prompt.wav') {
    const audio = await this.client.generate({ text, voice: 'alloy' });
    fs.writeFileSync(filename, audio);
    return filename;
  }
}

export default TTSService;
