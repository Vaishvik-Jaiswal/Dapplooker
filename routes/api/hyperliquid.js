const express = require('express');
const router = express.Router();
const { fetchWalletData } = require('../../utils/hyperliquid');
const { calculateDailyPnL } = require('../../utils/pnlCalculator');

router.get('/:wallet/pnl', async (req, res) => {
  try {
    const walletAddress = req.params.wallet;
    const startDate = req.query.start;
    const endDate = req.query.end;

    if (!walletAddress) {
      return res.status(400).json({ 
        error: 'Wallet address is required',
        message: 'Please provide a valid wallet address in the URL path'
      });
    }

    if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
      return res.status(400).json({ 
        error: 'Invalid wallet address format',
        message: 'Wallet address must be a valid Ethereum address (0x...)'
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Date range is required',
        message: 'Please provide both start and end dates as query parameters (start=YYYY-MM-DD&end=YYYY-MM-DD)'
      });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return res.status(400).json({ 
        error: 'Invalid date format',
        message: 'Dates must be in YYYY-MM-DD format'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ 
        error: 'Invalid date values',
        message: 'Please provide valid dates'
      });
    }

    if (start > end) {
      return res.status(400).json({ 
        error: 'Invalid date range',
        message: 'Start date must be before or equal to end date'
      });
    }

    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (daysDiff > 365) {
      return res.status(400).json({ 
        error: 'Date range too large',
        message: 'Date range cannot exceed 365 days'
      });
    }

    let walletData;
    try {
      walletData = await fetchWalletData(walletAddress, startDate, endDate);
      
      console.log('Wallet data fetched:', {
        hasUserState: !!walletData.userState,
        tradesCount: walletData.trades?.length || 0,
        fundingCount: walletData.funding?.length || 0,
        positionsCount: walletData.userState?.assetPositions?.length || 0
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ 
          error: 'Wallet not found',
          message: error.message
        });
      }
      if (error.message.includes('Invalid wallet')) {
        return res.status(400).json({ 
          error: 'Invalid wallet address',
          message: error.message
        });
      }
      if (error.message.includes('HyperLiquid API error')) {
        return res.status(502).json({
          error: 'External API error',
          message: 'Failed to fetch data from HyperLiquid API',
          details: error.message
        });
      }
      throw error;
    }

    let pnlData;
    try {
      pnlData = calculateDailyPnL(walletData, startDate, endDate);
    } catch (error) {
      console.error('Error calculating PnL:', error);
      return res.status(500).json({ 
        error: 'Failed to calculate PnL',
        message: error.message
      });
    }

    const hasTrades = walletData.trades && walletData.trades.length > 0;
    const hasFunding = walletData.funding && walletData.funding.length > 0;
    const hasPositions = walletData.userState?.assetPositions && walletData.userState.assetPositions.length > 0;
    
    let notes = 'PnL calculated using daily close prices. Historical price data may be approximated.';
    if (!hasTrades) {
      notes += ' Note: Trade history not available - realized PnL may be incomplete. Using position data for calculations.';
    }
    if (!hasFunding) {
      notes += ' Funding data not available for this wallet.';
    }

    const response = {
      wallet: walletAddress,
      start: startDate,
      end: endDate,
      daily: pnlData.daily,
      summary: pnlData.summary,
      diagnostics: {
        data_source: 'hyperliquid_api',
        last_api_call: walletData.fetchedAt || new Date().toISOString(),
        data_available: {
          positions: hasPositions,
          trades: hasTrades,
          funding: hasFunding
        },
        notes: notes
      },
      rawData: {
        userState: walletData.userState,
        trades: walletData.trades,
        funding: walletData.funding,
        fetchedAt: walletData.fetchedAt
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error in HyperLiquid PnL endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
});

module.exports = router;

