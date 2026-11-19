/**
 * SalaryWay Notification Service Abstraction
 * Generates actionable alerts based on budget thresholds and financial events.
 * Safe local abstraction with zero privacy intrusion.
 */

export function generateAlerts(monthData) {
  if (!monthData) return [];
  const alerts = [];
  const { allocations, transactions } = monthData;
  if (!allocations || !transactions) return alerts;

  const categorySpend = {};
  transactions.forEach((t) => {
    if (t.type === 'expense') {
      categorySpend[t.category] = (categorySpend[t.category] || 0) + (t.amountPaise || 0);
    } else if (t.type === 'refund') {
      categorySpend[t.category] = (categorySpend[t.category] || 0) - (t.amountPaise || 0);
    }
  });

  const categoryNames = {
    essential: 'Essential Expenses',
    lifestyle: 'Lifestyle',
    debt: 'Debt Repayment',
    savings: 'Savings',
    personal: 'Invest in Myself',
  };

  Object.entries(allocations).forEach(([catId, allocated]) => {
    const spent = categorySpend[catId] || 0;
    const name = categoryNames[catId] || catId;
    if (allocated <= 0) return;
    const pct = (spent / allocated) * 100;

    if (pct > 100) {
      alerts.push({
        id: `overspend-${catId}`,
        type: 'danger',
        category: catId,
        title: 'Overspending Warning',
        message: `You've exceeded your ${name} budget by ₹${((spent - allocated) / 100).toLocaleString('en-IN')}.`,
      });
    } else if (pct >= 80) {
      alerts.push({
        id: `warning-${catId}`,
        type: 'warning',
        category: catId,
        title: 'Budget Alert',
        message: `Your ${name} budget has reached ${Math.round(pct)}%.`,
      });
    }
  });

  return alerts;
}
