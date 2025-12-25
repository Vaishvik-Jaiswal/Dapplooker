import { useState } from 'react';
import axios from 'axios';

function TokenInsight() {
  const [tokenId, setTokenId] = useState('chainlink');
  const [vsCurrency, setVsCurrency] = useState('usd');
  const [historyDays, setHistoryDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [showRawResponse, setShowRawResponse] = useState(false);
  const [rawResponse, setRawResponse] = useState(null);

  const exampleTokens = ['bitcoin', 'ethereum', 'chainlink', 'cardano', 'solana', 'polygon'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setRawResponse(null);
    setShowRawResponse(false);

    try {
      const response = await axios.post(
        `/api/token/${tokenId}/insight`,
        {
          vs_currency: vsCurrency,
          history_days: historyDays
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );

      setResult(response.data);
      setRawResponse(response.data);
    } catch (err) {
      if (err.response) {
        setError(err.response.data?.error || `Error: ${err.response.status} ${err.response.statusText}`);
      } else {
        setError(err.message || 'Failed to fetch token insight');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = (token) => {
    setTokenId(token);
  };

  const formatCurrency = (value) => {
    if (!value) return 'N/A';
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatPrice = (value) => {
    if (!value) return 'N/A';
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`;
  };

  const getSentimentClass = (sentiment) => {
    const lower = sentiment.toLowerCase();
    if (lower === 'positive') return 'bg-green-100 text-green-800';
    if (lower === 'negative') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div>
            <label htmlFor="tokenId" className="block text-sm font-medium text-gray-700 mb-2">
              Token ID (CoinGecko)
            </label>
            <input
              id="tokenId"
              type="text"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value.toLowerCase())}
              placeholder="e.g., chainlink, bitcoin, ethereum"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
              required
            />
          </div>

          <div>
            <label htmlFor="vsCurrency" className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              id="vsCurrency"
              value={vsCurrency}
              onChange={(e) => setVsCurrency(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors bg-white"
            >
              <option value="usd">USD</option>
              <option value="eur">EUR</option>
              <option value="btc">BTC</option>
              <option value="eth">ETH</option>
            </select>
          </div>

          <div>
            <label htmlFor="historyDays" className="block text-sm font-medium text-gray-700 mb-2">
              History Days
            </label>
            <select
              id="historyDays"
              value={historyDays}
              onChange={(e) => setHistoryDays(Number(e.target.value))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors bg-white"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium py-3 px-6 rounded-lg hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg disabled:transform-none"
        >
          {loading ? 'Loading...' : 'Get Token Insight'}
        </button>
      </form>

      <div className="bg-indigo-50 p-4 rounded-lg mb-6">
        <div className="font-semibold text-gray-800 mb-2 text-sm">Try these tokens:</div>
        <div className="flex flex-wrap gap-2">
          {exampleTokens.map(token => (
            <span
              key={token}
              onClick={() => handleExampleClick(token)}
              className="bg-white px-3 py-1.5 rounded-md text-sm cursor-pointer border border-gray-200 hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all duration-200"
            >
              {token}
            </span>
          ))}
        </div>
      </div>

      {loading && (
        <div className="text-center py-5 text-indigo-600 font-medium">
          Fetching token data and generating AI insight...
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mt-5">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="mt-8 p-6 bg-gray-50 rounded-lg border-l-4 border-indigo-500">
          <div className="mb-4 flex justify-between items-center">
            <div className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              📊 Token Information
            </div>
            <button
              type="button"
              onClick={() => setShowRawResponse(!showRawResponse)}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {showRawResponse ? 'Hide' : 'Show'} Raw API Response
            </button>
          </div>

          {showRawResponse && rawResponse && (
            <div className="mb-6 bg-gray-900 rounded-lg p-4 overflow-auto max-h-96">
              <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap">
                {JSON.stringify(rawResponse, null, 2)}
              </pre>
            </div>
          )}

          <div className="mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-600 mb-1">Name</div>
                <div className="text-lg font-semibold text-gray-800">{result.token.name}</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-600 mb-1">Symbol</div>
                <div className="text-lg font-semibold text-gray-800">
                  {result.token.symbol.toUpperCase()}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-600 mb-1">Current Price</div>
                <div className="text-lg font-semibold text-gray-800">
                  {formatPrice(result.token.market_data.current_price_usd)}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-600 mb-1">Market Cap</div>
                <div className="text-lg font-semibold text-gray-800">
                  {formatCurrency(result.token.market_data.market_cap_usd)}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-600 mb-1">24h Volume</div>
                <div className="text-lg font-semibold text-gray-800">
                  {formatCurrency(result.token.market_data.total_volume_usd)}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-600 mb-1">24h Change</div>
                <div className={`text-lg font-semibold ${
                  result.token.market_data.price_change_percentage_24h > 0
                    ? 'text-green-600'
                    : result.token.market_data.price_change_percentage_24h < 0
                    ? 'text-red-600'
                    : 'text-gray-800'
                }`}>
                  {result.token.market_data.price_change_percentage_24h
                    ? `${result.token.market_data.price_change_percentage_24h > 0 ? '+' : ''}${result.token.market_data.price_change_percentage_24h.toFixed(2)}%`
                    : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              🤖 AI Insight
            </div>
            <div>
              <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-medium mb-3 ${getSentimentClass(result.insight.sentiment)}`}>
                {result.insight.sentiment}
              </span>
              <div className="bg-white p-4 rounded-lg border border-gray-200 mb-3 leading-relaxed text-gray-700">
                {result.insight.reasoning}
              </div>
              <div className="text-sm text-gray-600">
                Model: {result.insight.model.provider} / {result.insight.model.model.split('/').pop()}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TokenInsight;
