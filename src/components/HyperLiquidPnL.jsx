import { useState } from 'react';
import axios from 'axios';

function HyperLiquidPnL() {
  const getDefaultEndDate = () => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  };

  const getDefaultStartDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
  };

  const [walletAddress, setWalletAddress] = useState('');
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [showRawResponse, setShowRawResponse] = useState(false);
  const [rawResponse, setRawResponse] = useState(null);
  const [showRawWalletData, setShowRawWalletData] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setRawResponse(null);
    setShowRawResponse(false);
    setShowRawWalletData(false);

    if (!walletAddress || !walletAddress.startsWith('0x') || walletAddress.length !== 42) {
      setError('Please enter a valid Ethereum wallet address (0x...)');
      setLoading(false);
      return;
    }

    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      setLoading(false);
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date must be before or equal to end date');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        `/api/hyperliquid/${walletAddress}/pnl`,
        {
          params: {
            start: startDate,
            end: endDate
          },
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
        setError(err.response.data?.error || err.response.data?.message || `Error: ${err.response.status} ${err.response.statusText}`);
      } else {
        setError(err.message || 'Failed to fetch wallet PnL data');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'N/A';
    const num = parseFloat(value);
    if (isNaN(num)) return 'N/A';
    
    const sign = num >= 0 ? '+' : '';
    const formatted = `${sign}$${Math.abs(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return formatted;
  };

  const getPnLColor = (value) => {
    if (value === null || value === undefined) return 'text-gray-600';
    const num = parseFloat(value);
    if (isNaN(num)) return 'text-gray-600';
    return num >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getPnLBgColor = (value) => {
    if (value === null || value === undefined) return 'bg-gray-50';
    const num = parseFloat(value);
    if (isNaN(num)) return 'bg-gray-50';
    return num >= 0 ? 'bg-green-50' : 'bg-red-50';
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div>
            <label htmlFor="walletAddress" className="block text-sm font-medium text-gray-700 mb-2">
              Wallet Address
            </label>
            <input
              id="walletAddress"
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors font-mono text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={endDate}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
              required
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              max={getDefaultEndDate()}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium py-3 px-6 rounded-lg hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg disabled:transform-none"
        >
          {loading ? 'Fetching PnL Data...' : 'Get Daily PnL'}
        </button>
      </form>

      <div className="bg-indigo-50 p-4 rounded-lg mb-6">
        <div className="font-semibold text-gray-800 mb-2 text-sm">Quick Date Ranges:</div>
        <div className="flex flex-wrap gap-2">
          <span
            onClick={() => {
              const end = getDefaultEndDate();
              const start = new Date(end);
              start.setDate(start.getDate() - 7);
              setStartDate(start.toISOString().split('T')[0]);
              setEndDate(end);
            }}
            className="bg-white px-3 py-1.5 rounded-md text-sm cursor-pointer border border-gray-200 hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all duration-200"
          >
            Last 7 days
          </span>
        
        </div>
      </div>

      {loading && (
        <div className="text-center py-5 text-indigo-600 font-medium">
          Fetching wallet PnL data from HyperLiquid...
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mt-5">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-6">
          <div className="flex justify-end gap-2 mb-4">
            <button
              type="button"
              onClick={() => setShowRawWalletData(!showRawWalletData)}
              className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              {showRawWalletData ? 'Hide' : 'Show'} Raw HyperLiquid Data
            </button>
            <button
              type="button"
              onClick={() => setShowRawResponse(!showRawResponse)}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {showRawResponse ? 'Hide' : 'Show'} Full API Response
            </button>
          </div>

          {showRawWalletData && rawResponse?.rawData && (
            <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-96 mb-6">
              <div className="text-purple-400 text-sm font-semibold mb-2">Raw HyperLiquid Wallet Data (from fetchWalletData):</div>
              <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap">
                {JSON.stringify(rawResponse.rawData, null, 2)}
              </pre>
            </div>
          )}

          {showRawResponse && rawResponse && (
            <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-96 mb-6">
              <div className="text-indigo-400 text-sm font-semibold mb-2">Full API Response:</div>
              <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap">
                {JSON.stringify(rawResponse, null, 2)}
              </pre>
            </div>
          )}

          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border-l-4 border-indigo-500">
            <div className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              📊 Summary
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-600 mb-1">Total Realized</div>
                <div className={`text-lg font-semibold ${getPnLColor(result.summary.total_realized_usd)}`}>
                  {formatCurrency(result.summary.total_realized_usd)}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-600 mb-1">Total Unrealized</div>
                <div className={`text-lg font-semibold ${getPnLColor(result.summary.total_unrealized_usd)}`}>
                  {formatCurrency(result.summary.total_unrealized_usd)}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-600 mb-1">Total Fees</div>
                <div className="text-lg font-semibold text-gray-800">
                  {formatCurrency(result.summary.total_fees_usd)}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-600 mb-1">Total Funding</div>
                <div className={`text-lg font-semibold ${getPnLColor(result.summary.total_funding_usd)}`}>
                  {formatCurrency(result.summary.total_funding_usd)}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border-2 border-indigo-300">
                <div className="text-xs text-gray-600 mb-1">Net PnL</div>
                <div className={`text-xl font-bold ${getPnLColor(result.summary.net_pnl_usd)}`}>
                  {formatCurrency(result.summary.net_pnl_usd)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                📅 Daily PnL Breakdown
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Wallet: <span className="font-mono">{result.wallet}</span> | 
                Period: {result.start} to {result.end}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Realized PnL
                    </th>
                   
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Fees
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Funding
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Net PnL
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Equity
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {result.daily.map((day, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {day.date}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${getPnLColor(day.realized_pnl_usd)}`}>
                        {formatCurrency(day.realized_pnl_usd)}
                      </td>
                     
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                        {formatCurrency(day.fees_usd)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${getPnLColor(day.funding_usd)}`}>
                        {formatCurrency(day.funding_usd)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${getPnLColor(day.net_pnl_usd)} ${getPnLBgColor(day.net_pnl_usd)}`}>
                        {formatCurrency(day.net_pnl_usd)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                        {formatCurrency(day.equity_usd)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {result.diagnostics && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600">
                <div className="font-semibold mb-2">Diagnostics:</div>
                <div className="space-y-1">
                  <div>Data Source: {result.diagnostics.data_source}</div>
                  <div>Last API Call: {new Date(result.diagnostics.last_api_call).toLocaleString()}</div>
                  {result.diagnostics.notes && (
                    <div className="text-xs text-gray-500 mt-2 italic">{result.diagnostics.notes}</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default HyperLiquidPnL;

