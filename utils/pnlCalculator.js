function calculateDailyPnL(walletData, startDate, endDate) {
  if (!walletData) {
    throw new Error('Wallet data is required');
  }

  const userState = walletData.userState || {};
  const trades = walletData.trades || [];
  const funding = walletData.funding || [];
  
  const dailyPnL = {};
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let dt = new Date(start); dt <= end; dt.setUTCDate(dt.getUTCDate() + 1)) {
    const dateStr = dt.toISOString().split('T')[0];
    dailyPnL[dateStr] = {
      date: dateStr,
      realized_pnl_usd: 0,
      unrealized_pnl_usd: 0,
      fees_usd: 0,
      funding_usd: 0,
      net_pnl_usd: 0,
      equity_usd: 0
    };
  }

  for (let i = 0; i < trades.length; i++) {
    const trade = trades[i];
    if (!trade || !trade.time) continue;
    
    const tradeDate = new Date(trade.time).toISOString().split('T')[0];
    
    if (dailyPnL[tradeDate]) {
      const closedPnl = parseFloat(trade.closedPnl || 0);
      if (!isNaN(closedPnl)) {
        dailyPnL[tradeDate].realized_pnl_usd += closedPnl;
      }
      
      const fee = parseFloat(trade.fee || 0);
      if (!isNaN(fee)) {
        dailyPnL[tradeDate].fees_usd += Math.abs(fee);
      }
      
      const builderFee = parseFloat(trade.builderFee || 0);
      if (!isNaN(builderFee) && builderFee !== 0) {
        dailyPnL[tradeDate].fees_usd += Math.abs(builderFee);
      }
    }
  }

  for (let i = 0; i < funding.length; i++) {
    const fund = funding[i];
    if (!fund || !fund.time) continue;
    
    const fundDate = new Date(fund.time).toISOString().split('T')[0];
    
    if (dailyPnL[fundDate]) {
      let fundingAmount = 0;
      if (fund.usdc !== undefined) {
        fundingAmount = parseFloat(fund.usdc);
      } else if (fund.delta && fund.delta.usdc !== undefined) {
        fundingAmount = parseFloat(fund.delta.usdc);
      } else if (fund.delta && fund.delta.funding !== undefined) {
        fundingAmount = parseFloat(fund.delta.funding);
      } else {
        fundingAmount = parseFloat(fund.funding || fund.fundingPayment || fund.amount || fund.fundingAmount || fund.fundingFee || 0);
      }
      
      if (!isNaN(fundingAmount)) {
        dailyPnL[fundDate].funding_usd += fundingAmount;
      }
    }
  }

  const today = new Date().toISOString().split('T')[0];
  
  if (dailyPnL[today] && userState.assetPositions) {
    let totalUnrealized = 0;
    for (let i = 0; i < userState.assetPositions.length; i++) {
      const assetPosition = userState.assetPositions[i];
      if (assetPosition && assetPosition.position) {
        const unrealizedPnl = parseFloat(assetPosition.position.unrealizedPnl || 0);
        if (!isNaN(unrealizedPnl)) {
          totalUnrealized += unrealizedPnl;
        }
      }
    }
    dailyPnL[today].unrealized_pnl_usd = totalUnrealized;
  }

  for (const date in dailyPnL) {
    dailyPnL[date].net_pnl_usd =
      dailyPnL[date].realized_pnl_usd +
      dailyPnL[date].unrealized_pnl_usd -
      dailyPnL[date].fees_usd +
      dailyPnL[date].funding_usd;
  }

  const marginSummary = userState.marginSummary || {};
  const currentAccountValue = parseFloat(marginSummary.accountValue || 0);
  
  const dailyArray = [];
  for (const date in dailyPnL) {
    dailyArray.push(dailyPnL[date]);
  }
  
  for (let i = 0; i < dailyArray.length; i++) {
    for (let j = i + 1; j < dailyArray.length; j++) {
      if (dailyArray[i].date > dailyArray[j].date) {
        const temp = dailyArray[i];
        dailyArray[i] = dailyArray[j];
        dailyArray[j] = temp;
      }
    }
  }
  
  if (dailyArray.length > 0) {
    if (currentAccountValue > 0) {
      let todayIndex = -1;
      for (let i = 0; i < dailyArray.length; i++) {
        if (dailyArray[i].date === today) {
          todayIndex = i;
          break;
        }
      }
      
      if (todayIndex >= 0) {
        dailyArray[todayIndex].equity_usd = currentAccountValue;
        
        for (let i = todayIndex - 1; i >= 0; i--) {
          dailyArray[i].equity_usd = dailyArray[i + 1].equity_usd - dailyArray[i + 1].net_pnl_usd;
        }
        
        for (let i = todayIndex + 1; i < dailyArray.length; i++) {
          dailyArray[i].equity_usd = dailyArray[i - 1].equity_usd + dailyArray[i].net_pnl_usd;
        }
      } else {
        let totalNetPnL = 0;
        for (let i = 0; i < dailyArray.length; i++) {
          totalNetPnL += dailyArray[i].net_pnl_usd;
        }
        let runningEquity = currentAccountValue - totalNetPnL;
        
        if (runningEquity <= 0) {
          runningEquity = currentAccountValue;
        }
        
        for (let i = 0; i < dailyArray.length; i++) {
          runningEquity += dailyArray[i].net_pnl_usd;
          dailyArray[i].equity_usd = parseFloat(runningEquity.toFixed(2));
        }
      }
    } else {
      let runningEquity = 0;
      for (let i = 0; i < dailyArray.length; i++) {
        runningEquity += dailyArray[i].net_pnl_usd;
        dailyArray[i].equity_usd = parseFloat(runningEquity.toFixed(2));
      }
    }
    
    for (let i = 0; i < dailyArray.length; i++) {
      dailyArray[i].equity_usd = parseFloat(dailyArray[i].equity_usd.toFixed(2));
    }
  }

  const daily = dailyArray;

  const summary = {
    total_realized_usd: 0,
    total_unrealized_usd: 0,
    total_fees_usd: 0,
    total_funding_usd: 0,
    net_pnl_usd: 0
  };
  
  for (let i = 0; i < daily.length; i++) {
    summary.total_realized_usd += daily[i].realized_pnl_usd;
    summary.total_unrealized_usd += daily[i].unrealized_pnl_usd;
    summary.total_fees_usd += daily[i].fees_usd;
    summary.total_funding_usd += daily[i].funding_usd;
  }

  if (daily.length > 0) {
    const endDateIndex = daily.length - 1;
    summary.net_pnl_usd = daily[endDateIndex].net_pnl_usd;
  }

  summary.total_realized_usd = parseFloat(summary.total_realized_usd.toFixed(2));
  summary.total_unrealized_usd = parseFloat(summary.total_unrealized_usd.toFixed(2));
  summary.total_fees_usd = parseFloat(summary.total_fees_usd.toFixed(2));
  summary.total_funding_usd = parseFloat(summary.total_funding_usd.toFixed(2));
  summary.net_pnl_usd = parseFloat(summary.net_pnl_usd.toFixed(2));

  return { daily, summary };
}

module.exports = {
  calculateDailyPnL
};
