const express = require('express');
const router = express.Router();
const { fetchTokenData } = require('../../utils/coingecko');
const { generateInsight, buildPrompt } = require('../../utils/ai');

router.post('/:id/insight', async (req, res) => {
  try {
    const tokenId = req.params.id.toLowerCase();
    const { vs_currency = 'usd', history_days = 30 } = req.body;

    if (!tokenId) {
      return res.status(400).json({ error: 'Token ID is required' });
    }

    let tokenData;
    try {
      tokenData = await fetchTokenData(tokenId, vs_currency, history_days);
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }

    let insight;
    try {
      const prompt = buildPrompt(tokenData);
      const apiKey = process.env.GROQ_API_KEY;
      
      if (!apiKey) {
        throw new Error('GROQ_API_KEY is not set in environment variables');
      }
      
      insight = await generateInsight(prompt, apiKey);
    } catch (error) {
      console.error('AI generation failed:', error.message);
      insight = {
        reasoning: `Unable to generate AI insight: ${error.message}. Please check your GROQ_API_KEY in .env file. Get a free key from https://console.groq.com/keys`,
        sentiment: 'Neutral',
        model: {
          provider: 'groq',
          model: 'error'
        },
        error: error.message
      };
    }

    const response = {
      source: 'coingecko',
      token: {
        id: tokenData.id,
        symbol: tokenData.symbol,
        name: tokenData.name,
        market_data: tokenData.market_data
      },
      insight: insight
    };

    res.json(response);
  } catch (error) {
    console.error('Error in token insight endpoint:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

module.exports = router;

