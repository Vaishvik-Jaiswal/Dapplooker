# Dapplooker API Tools

A full-stack web application that provides cryptocurrency token insights and HyperLiquid wallet analytics. Built with Node.js, Express, React, and Vite.

## Features

- **Token Insight API**: Fetches cryptocurrency token data from CoinGecko and generates AI-powered insights using Groq's LLM
- **HyperLiquid PnL Calculator**: Analyzes HyperLiquid wallet performance with daily PnL breakdowns, including realized/unrealized PnL, fees, and funding payments

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```bash
GROQ_API_KEY=your_groq_api_key_here
PORT=3000
```

3. Get a free Groq API key:
   - Go to https://console.groq.com/keys
   - Sign up for a free account
   - Create a new API key
   - Add it to your `.env` file as `GROQ_API_KEY=your_key_here`

4. Start the development server:
```bash
npm run dev
```

This will start both the backend server (port 3000) and the frontend Vite dev server (port 5173).

5. For production:
```bash
npm run build
npm start
```

## API Endpoints

### POST `/api/token/:id/insight`

Fetches token data and generates AI insight.

**Parameters:**
- `:id` - CoinGecko token ID (e.g., `chainlink`, `bitcoin`, `ethereum`)

**Request Body (optional):**
```json
{
  "vs_currency": "usd",
  "history_days": 30
}
```

**Response:**
```json
{
  "source": "coingecko",
  "token": {
    "id": "chainlink",
    "symbol": "link",
    "name": "Chainlink",
    "market_data": {
      "current_price_usd": 7.23,
      "market_cap_usd": 3500000000,
      "total_volume_usd": 120000000,
      "price_change_percentage_24h": -1.2
    }
  },
  "insight": {
    "reasoning": "Analysis text here",
    "sentiment": "Neutral",
    "model": {
      "provider": "groq",
      "model": "llama-3.1-8b-instant"
    }
  }
}
```

### GET `/api/hyperliquid/:wallet/pnl?start=YYYY-MM-DD&end=YYYY-MM-DD`

Fetches wallet's daily PnL from HyperLiquid.

**Parameters:**
- `:wallet` - Ethereum wallet address (0x...)
- `start` - Start date in YYYY-MM-DD format
- `end` - End date in YYYY-MM-DD format

**Response:**
```json
{
  "wallet": "0x...",
  "start": "2024-01-01",
  "end": "2024-01-07",
  "daily": [
    {
      "date": "2024-01-01",
      "realized_pnl_usd": 100.50,
      "unrealized_pnl_usd": 0,
      "fees_usd": 5.25,
      "funding_usd": 2.10,
      "net_pnl_usd": 97.35,
      "equity_usd": 1000.00
    }
  ],
  "summary": {
    "total_realized_usd": 100.50,
    "total_unrealized_usd": 0,
    "total_fees_usd": 5.25,
    "total_funding_usd": 2.10,
    "net_pnl_usd": 97.35
  },
  "diagnostics": {
    "data_source": "hyperliquid_api",
    "last_api_call": "2024-01-07T12:00:00.000Z",
    "data_available": {
      "positions": true,
      "trades": true,
      "funding": true
    }
  }
}
```

## Example Usage

### Token Insight
```bash
curl -X POST http://localhost:3000/api/token/chainlink/insight \
  -H "Content-Type: application/json" \
  -d '{"vs_currency": "usd", "history_days": 30}'
```

### HyperLiquid PnL
```bash
curl "http://localhost:3000/api/hyperliquid/0x1234.../pnl?start=2024-01-01&end=2024-01-07"
```

## Project Structure

```
Dapplooker/
├── routes/
│   └── api/
│       ├── token.js          # Token insight API routes
│       └── hyperliquid.js    # HyperLiquid PnL API routes
├── src/
│   ├── components/
│   │   ├── TokenInsight.jsx      # Token insight UI component
│   │   └── HyperLiquidPnL.jsx    # HyperLiquid PnL UI component
│   ├── App.jsx                    # Main app component
│   └── main.jsx                   # React entry point
├── utils/
│   ├── coingecko.js          # CoinGecko API integration
│   ├── ai.js                  # Groq AI integration
│   ├── hyperliquid.js         # HyperLiquid API integration
│   └── pnlCalculator.js       # PnL calculation logic
├── server.js                  # Express server
└── package.json
```

## Technologies

- **Backend**: Node.js, Express
- **Frontend**: React, Vite
- **Styling**: Tailwind CSS
- **APIs**: CoinGecko, HyperLiquid, Groq
