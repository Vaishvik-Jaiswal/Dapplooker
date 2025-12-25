const axios = require('axios');

const groqUrl = 'https://api.groq.com/openai/v1/chat/completions';
const modelName = 'llama-3.1-8b-instant';

async function generateInsight(prompt, apiKey) {
  if (!apiKey) {
    throw new Error('AI API key is required. Set GROQ_API_KEY in .env');
  }

  try {
    const response = await axios.post(
      groqUrl,
      {
        model: modelName,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.7,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const aiResponse = response.data;
    let aiText = '';
    
    if (aiResponse.choices && aiResponse.choices.length > 0) {
      if (aiResponse.choices[0].message && aiResponse.choices[0].message.content) {
        aiText = aiResponse.choices[0].message.content;
      }
    }
    
    if (!aiText || aiText.trim().length === 0) {
      throw new Error('Empty response from AI model');
    }

    // Parse the response
    let parsed = null;
    try {
      parsed = JSON.parse(aiText);
    } catch (e) {
      // Try to find JSON in the text
      const jsonStart = aiText.indexOf('{');
      const jsonEnd = aiText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        const jsonString = aiText.substring(jsonStart, jsonEnd + 1);
        try {
          parsed = JSON.parse(jsonString);
        } catch (e2) {
          parsed = null;
        }
      }
    }

    let sentiment = 'Neutral';
    let reasoning = 'Market analysis based on available data';

    if (parsed) {
      if (parsed.sentiment) {
        let sent = parsed.sentiment;
        if (typeof sent === 'string') {
          sent = sent.charAt(0).toUpperCase() + sent.slice(1).toLowerCase();
          if (sent === 'Positive' || sent === 'Negative' || sent === 'Neutral') {
            sentiment = sent;
          }
        }
      }
      if (parsed.reasoning) {
        reasoning = parsed.reasoning;
      }
    } else {
      // Try to find sentiment in text
      const textLower = aiText.toLowerCase();
      if (textLower.includes('positive') || textLower.includes('bullish')) {
        sentiment = 'Positive';
      } else if (textLower.includes('negative') || textLower.includes('bearish')) {
        sentiment = 'Negative';
      }
      
      if (aiText.trim().length > 0) {
        reasoning = aiText.trim().substring(0, 500);
      }
    }

    return {
      reasoning: reasoning,
      sentiment: sentiment,
      model: {
        provider: 'groq',
        model: modelName
      }
    };
  } catch (error) {
    if (error.response) {
      console.error('Groq API error:', error.response.status, error.response.statusText);
      throw new Error(`AI API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw new Error(`AI API error: ${error.message}`);
  }
}

function buildPrompt(tokenData) {
  const { name, symbol, market_data } = tokenData;
  
  const prompt = `You are a cryptocurrency market analyst. Analyze this token and provide insights in JSON format.

Token: ${name} (${symbol.toUpperCase()})
Current Price (USD): $${market_data.current_price_usd}
Market Cap (USD): $${market_data.market_cap_usd?.toLocaleString() || 'N/A'}
24h Volume: $${market_data.total_volume_usd?.toLocaleString() || 'N/A'}
24h Change: ${market_data.price_change_percentage_24h}%
${market_data.price_change_percentage_7d ? `7d Change: ${market_data.price_change_percentage_7d}%` : ''}
${market_data.price_change_percentage_30d ? `30d Change: ${market_data.price_change_percentage_30d}%` : ''}

Provide a brief analysis (2-3 sentences) in the "reasoning" field and a sentiment ("Positive", "Negative", or "Neutral") in the "sentiment" field.

Respond with valid JSON only:
{
  "reasoning": "Your analysis here",
  "sentiment": "Positive|Negative|Neutral"
}`;

  return prompt;
}

module.exports = {
  generateInsight,
  buildPrompt
};
