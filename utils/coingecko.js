const axios = require('axios');

const baseUrl = 'https://api.coingecko.com/api/v3';

async function fetchTokenData(tokenId, vsCurrency, historyDays) {
  if (!vsCurrency) {
    vsCurrency = 'usd';
  }

  try {
    const url = `${baseUrl}/coins/${tokenId}`;
    const response = await axios.get(url, {
      params: {
        localization: false,
        tickers: false,
        market_data: true,
        community_data: false,
        developer_data: false,
        sparkline: false
      }
    });

    const data = response.data;
    
    const marketData = {};
    if (data.market_data && data.market_data.current_price) {
      marketData.current_price_usd = data.market_data.current_price[vsCurrency] || null;
    } else {
      marketData.current_price_usd = null;
    }
    
    if (data.market_data && data.market_data.market_cap) {
      marketData.market_cap_usd = data.market_data.market_cap[vsCurrency] || null;
    } else {
      marketData.market_cap_usd = null;
    }
    
    if (data.market_data && data.market_data.total_volume) {
      marketData.total_volume_usd = data.market_data.total_volume[vsCurrency] || null;
    } else {
      marketData.total_volume_usd = null;
    }
    
    marketData.price_change_percentage_24h = data.market_data?.price_change_percentage_24h || null;
    marketData.price_change_percentage_7d = data.market_data?.price_change_percentage_7d || null;
    marketData.price_change_percentage_30d = data.market_data?.price_change_percentage_30d || null;

    let historicalData = null;
    if (historyDays) {
      try {
        const historyUrl = `${baseUrl}/coins/${tokenId}/market_chart`;
        const historyResponse = await axios.get(historyUrl, {
          params: {
            vs_currency: vsCurrency,
            days: historyDays
          }
        });
        
        if (historyResponse.data && historyResponse.data.prices) {
          const prices = historyResponse.data.prices;
          const lastTen = [];
          const start = Math.max(0, prices.length - 10);
          for (let i = start; i < prices.length; i++) {
            lastTen.push(prices[i]);
          }
          historicalData = {
            prices: lastTen,
            total_days: historyDays
          };
        }
      } catch (err) {
        console.warn('Failed to fetch historical data:', err.message);
      }
    }

    const result = {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      description: '',
      market_data: marketData,
      historical_data: historicalData
    };

    if (data.description && data.description.en) {
      result.description = data.description.en;
    }

    return result;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw new Error(`Token '${tokenId}' not found on CoinGecko`);
    }
    throw new Error(`Failed to fetch token data: ${error.message}`);
  }
}

module.exports = {
  fetchTokenData
};
