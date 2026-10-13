// Calcula el monto financiado restando el pago inicial
function calculateFinancedAmount() {
  const requestedAmount = parseFloat(document.getElementById("requestedAmount").value) || 0;
  const downPayment = parseFloat(document.querySelector("#downPayment").value) || 0;
  return Math.max(0, requestedAmount - downPayment);
}

// Suma la comisión administrativa al monto financiado
function calculateBaseAmountWithFee() {
  const adminFee = parseFloat(document.querySelector("#adminFee").value) || 0;
  return calculateFinancedAmount() + adminFee;
}

// Retorna el monto base del préstamo según la opción de comisión
function calculateFinalFinancedAmount(selectedOption) {
  if (selectedOption === "Sumar al monto financiado") {
    return calculateBaseAmountWithFee();
  }
  return calculateFinancedAmount();
}

// Convierte la tasa anual a tasa mensual
function calculateMonthlyRate(anualRate) {
  return (anualRate || 0) / 12 / 100;
}

// Calcula la cuota inicial fija estimada
function calculateFixedInstallment(anualRate, monthsDeadline, monthlyInsurancePerc) {
  const selectedOption = document.querySelector("#adminFeeType").value;
  const baseAmount = calculateFinalFinancedAmount(selectedOption);
  const rate = calculateMonthlyRate(anualRate);
  let installment = 0;

  if (monthsDeadline <= 0) {
    return 0;
  }
  if (rate === 0) {
    installment = baseAmount / monthsDeadline;
  } else {
    installment = (baseAmount * rate) / (1 - Math.pow(1 + rate, -monthsDeadline));
  }

  const monthlyInsurance = (baseAmount * monthlyInsurancePerc) / 100;
  return installment + monthlyInsurance;
}

// Calcula la fecha de pago manteniendo el día y ajustando fin de mes
function calculatePaymentDate(firstPaymentDateStr, monthIndex) {
  if (!firstPaymentDateStr) return "";
  const parts = firstPaymentDateStr.split('-');
  if (parts.length !== 3) return "";

  const startYear = parseInt(parts[0], 10);
  const startMonth = parseInt(parts[1], 10) - 1;
  const startDay = parseInt(parts[2], 10);

  const totalMonths = startMonth + monthIndex;
  const targetYear = startYear + Math.floor(totalMonths / 12);
  const targetMonth = ((totalMonths % 12) + 12) % 12;

  const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const actualDay = Math.min(startDay, daysInMonth);

  const dd = String(actualDay).padStart(2, '0');
  const mm = String(targetMonth + 1).padStart(2, '0');
  return `${dd}/${mm}/${targetYear}`;
}

// Genera la tabla de amortización completa cuota fija o capital fijo
function calculateAmortization(baseAmount, anualRate, monthsDeadline, monthlyInsurancePerc, amortizationType, extraPayments, firstPaymentDate) {
  if (baseAmount <= 0 || monthsDeadline <= 0) {
    return [];
  }

  const monthlyRate = calculateMonthlyRate(anualRate);
  const fixedCapital = baseAmount / monthsDeadline;
  const fixedInstallment = monthlyRate === 0 
    ? fixedCapital 
    : (baseAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -monthsDeadline));

  const balanceTolerance = 0.000001;
  let balance = baseAmount;
  const payments = [];

  for (let month = 1; month <= monthsDeadline && balance > balanceTolerance; month++) {
    const initialBalance = balance;
    const interest = initialBalance * monthlyRate;
    const insurance = (initialBalance * (monthlyInsurancePerc || 0)) / 100;

    let capital = amortizationType === "Capital fijo" ? fixedCapital : (fixedInstallment - interest);
    capital = Math.min(Math.max(capital, 0), initialBalance);

    const balanceAfterInstallment = Math.max(0, initialBalance - capital);
    const scheduledExtra = extraPayments[month] || 0;
    const extraPayment = Math.min(scheduledExtra, balanceAfterInstallment);
    const finalBalance = Math.max(0, balanceAfterInstallment - extraPayment);

    const paymentDateStr = calculatePaymentDate(firstPaymentDate, month - 1);

    // Cuota total = Cuota base + Seguro (según la especificación oficial)
    const installment = capital + interest;
    const totalPayment = installment + insurance;

    payments.push({
      month: month,
      date: paymentDateStr,
      initialBalance: initialBalance,
      installment: installment,
      capital: capital,
      interest: interest,
      insurance: insurance,
      extraPayment: extraPayment,
      totalPayment: totalPayment,
      finalBalance: finalBalance
    });

    balance = finalBalance;
  }

  return payments;
}
