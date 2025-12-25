import { useState } from 'react';
import TokenInsight from './components/TokenInsight';
import HyperLiquidPnL from './components/HyperLiquidPnL';

function App() {
  const [activeTab, setActiveTab] = useState('token');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600 p-5">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-2xl p-8 md:p-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
          🔍 Dapplooker API Tools
        </h1>
        <p className="text-gray-600 mb-8 text-sm md:text-base">
          Token insights and HyperLiquid wallet analytics
        </p>

        <div className="flex space-x-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('token')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'token'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🔍 Token Insight
          </button>
          <button
            onClick={() => setActiveTab('hyperliquid')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'hyperliquid'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            💰 HyperLiquid PnL
          </button>
        </div>

        <div>
          {activeTab === 'token' && <TokenInsight />}
          {activeTab === 'hyperliquid' && <HyperLiquidPnL />}
        </div>
      </div>
    </div>
  );
}

export default App;

