function formatCurrency(amount, currency = 'DOP') {
  const val = Math.max(0, parseFloat(amount) || 0);
  const formatted = val.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `${currency} ${formatted}`;
}
