import SurveyResponse from '../models/SurveyResponse.js';
import SocialMediaSentiment from '../models/SocialMediaSentiment.js';

async function resolveSentiment(req, res) {
  const { type, id } = req.body;

  try {
    let result;
    if (type === 'survey') {
      result = await SurveyResponse.markAsResolved(id);
    } else if (type === 'social') {
      result = await SocialMediaSentiment.markAsResolved(id);
    } else {
      return res.status(400).json({ error: 'Invalid sentiment type' });
    }

    if (!result) {
      return res.status(404).json({ error: 'Sentiment record not found' });
    }

    res.json({ message: 'Sentiment marked as resolved', data: result });
  } catch (err) {
    console.error('Error resolving sentiment:', err);
    res.status(500).json({ error: 'Failed to resolve sentiment' });
  }
}

export { resolveSentiment };