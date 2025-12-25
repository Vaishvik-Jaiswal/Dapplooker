const axios = require('axios');

const BASE_URL = 'https://api.hyperliquid.xyz';

async function fetchUserState(walletAddress) {
  if (!walletAddress || !walletAddress.startsWith('0x')) {
    throw new Error('Invalid wallet address format');
  }

  try {
    let response;
    
    try {
      response = await axios.post(
        `${BASE_URL}/info`,
        {
          type: 'clearinghouseState',
          user: walletAddress
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );
    } catch (err) {
      if (err.response?.status === 422) {
        response = await axios.post(
          `${BASE_URL}/info`,
          {
            type: 'clearinghouseState',
            user: walletAddress.toLowerCase()
          },
          {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 15000
          }
        );
      } else {
        throw err;
      }
    }

    // Handle different response structures
    if (!response.data) {
      throw new Error('Empty response from HyperLiquid API');
    }

    const data = response.data.data || response.data;
    
    if (!data) {
      throw new Error('Invalid response structure from HyperLiquid API');
    }
    return data;
  } catch (error) {
    if (error.response) {
      if (error.response.status === 404) {
        throw new Error(`Wallet '${walletAddress}' not found on HyperLiquid`);
      }
      if (error.response.status === 400) {
        throw new Error(`Invalid wallet address: ${walletAddress}`);
      }
      if (error.response.status === 422) {
        throw new Error(`Invalid request format: ${JSON.stringify(error.response.data || error.response.statusText)}`);
      }
      throw new Error(`HyperLiquid API error: ${error.response.status} - ${error.response.statusText}`);
    }
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout: HyperLiquid API did not respond in time');
    }
    throw new Error(`Failed to fetch user state: ${error.message}`);
  }
}

async function getUserFills(walletAddress, startDate, endDate) {
  if (!walletAddress || !walletAddress.startsWith('0x')) {
    throw new Error('Invalid wallet address format');
  }

  const allFills = [];
  let currentStartTime = new Date(startDate).getTime();
  const endTime = new Date(endDate).getTime() + (24 * 60 * 60 * 1000) - 1;

  try {
    while (currentStartTime <= endTime) {
      let response;
      
      try {
        response = await axios.post(
          `${BASE_URL}/info`,
          {
            type: 'userFillsByTime',
            user: walletAddress,
            startTime: currentStartTime,
            endTime: endTime
          },
          {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        );
      } catch (err) {
        if (err.response?.status === 422) {
          try {
            response = await axios.post(
              `${BASE_URL}/info`,
              {
                type: 'userFillsByTime',
                user: walletAddress.toLowerCase(),
                startTime: currentStartTime,
                endTime: endTime
              },
              {
                headers: {
                  'Content-Type': 'application/json'
                },
                timeout: 30000
              }
            );
          } catch (err2) {
            throw new Error(`HyperLiquid API error (getUserFills): ${err2.message}`);
          }
        } else {
          throw new Error(`HyperLiquid API error (getUserFills): ${err.message}`);
        }
      }

      const fills = response.data?.data || response.data || [];
      
      if (!fills || fills.length === 0) {
        break;
      }

      allFills.push(...fills);

      if (fills.length < 2000) {
        break;
      }

      currentStartTime = fills[fills.length - 1].time + 1;
    }

    if (allFills.length > 0) {
      console.log(`Successfully fetched ${allFills.length} fills from userFillsByTime endpoint`);
    }
    return allFills;
  } catch (error) {
    throw new Error(`HyperLiquid API error (getUserFills): ${error.message}`);
  }
}

async function getUserFunding(walletAddress, startDate, endDate) {
  if (!walletAddress || !walletAddress.startsWith('0x')) {
    throw new Error('Invalid wallet address format');
  }

  const allFunding = [];
  let currentStartTime = new Date(startDate).getTime();
  const endTime = new Date(endDate).getTime() + (24 * 60 * 60 * 1000) - 1;

  try {
    while (currentStartTime <= endTime) {
      let response;
      
      try {
        response = await axios.post(
          `${BASE_URL}/info`,
          {
            type: 'userFunding',
            user: walletAddress,
            startTime: currentStartTime,
            endTime: endTime
          },
          {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        );
      } catch (err) {
        if (err.response?.status === 422) {
          try {
            response = await axios.post(
              `${BASE_URL}/info`,
              {
                type: 'userFunding',
                user: walletAddress.toLowerCase(),
                startTime: currentStartTime,
                endTime: endTime
              },
              {
                headers: {
                  'Content-Type': 'application/json'
                },
                timeout: 30000
              }
            );
          } catch (err2) {
            throw new Error(`HyperLiquid API error (getUserFunding): ${err2.message}`);
          }
        } else {
          throw new Error(`HyperLiquid API error (getUserFunding): ${err.message}`);
        }
      }

      const funding = response.data?.data || response.data || [];
      
      if (!funding || funding.length === 0) {
        break;
      }

      allFunding.push(...funding);

      if (funding.length < 2000) {
        break;
      }

      currentStartTime = funding[funding.length - 1].time + 1;
    }

    if (allFunding.length > 0) {
      console.log(`Successfully fetched ${allFunding.length} funding events from userFunding endpoint`);
    }

    return allFunding;
  } catch (error) {
    console.warn('Failed to fetch funding data:', error.message);
    return [];
  }
}

async function fetchWalletData(walletAddress, startDate, endDate) {
  try {
    const [userState, fills, funding] = await Promise.all([
      fetchUserState(walletAddress),
      getUserFills(walletAddress, startDate, endDate).catch(err => {
        console.warn('Could not fetch fills, continuing with position data only:', err.message);
        return [];
      }),
      getUserFunding(walletAddress, startDate, endDate).catch(err => {
        console.warn('Could not fetch funding data, continuing without it:', err.message);
        return [];
      })
    ]);
    return {
      userState,
      trades: fills,
      funding,
      fetchedAt: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Failed to fetch wallet data: ${error.message}`);
  }
}

async function fetchMarketData(symbol) {
  try {
    const response = await axios.post(
      `${BASE_URL}/info`,
      {
        type: 'meta'
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    if (!response.data || !response.data.data) {
      throw new Error('Failed to fetch market metadata');
    }

    const meta = response.data.data;
    const symbolInfo = meta?.universe?.find(s => s.name === symbol);
    
    if (!symbolInfo) {
      throw new Error(`Symbol '${symbol}' not found`);
    }

    const priceResponse = await axios.post(
      `${BASE_URL}/info`,
      {
        type: 'l2Book',
        coin: symbol
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    const price = priceResponse.data?.data?.levels?.[0]?.[0] || null;

    return {
      symbol,
      price,
      symbolInfo
    };
  } catch (error) {
    throw new Error(`Failed to fetch market data: ${error.message}`);
  }
}

module.exports = {
  fetchUserState,
  getUserFills,
  getUserFunding,
  fetchWalletData,
  fetchMarketData
};
