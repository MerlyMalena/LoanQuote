function calculateFinancedAmount(){
    const requestedAmount=parseFloat(document.getElementById("requestedAmount").value)||0;
        const downPayment=parseFloat(document.querySelector("#downPayment").value)||0;
    let amountFinanced= requestedAmount-downPayment;
    return amountFinanced;
}

function calculateBaseAmountWithFee(){
  const adminFee= parseFloat(document.querySelector("#adminFee").value)||0;
    let baseAmount=calculateFinancedAmount()+adminFee;
    return baseAmount;
}

function calculateFinalFinancedAmount(selectedOption){
   let montoFinanciado=0;
    if (selectedOption=="Cobrar como cargo inicial"){
        montoFinanciado=calculateFinancedAmount();
    }
    else {
        montoFinanciado=calculateBaseAmountWithFee();
    }
    return montoFinanciado;
}

function calculateMonthlyRate(anualRate){
    let rate=anualRate/12/100;
    return rate;
}

function calculateFixedInstallment(anualRate, monthsDeadline,monthlyInsurancePerc){
    const selectedOption=document.querySelector("#adminFeeType").value;
    const baseAmount=calculateFinalFinancedAmount(selectedOption);
    const rate=calculateMonthlyRate(anualRate);
    let installment=0;

    if (monthsDeadline<=0){
        return 0;
    }
    if (rate===0){
        installment=baseAmount/monthsDeadline;
    }
    else {
        installment=baseAmount*rate/(1-Math.pow(1+rate,-monthsDeadline));
    }

    const monthlyInsurance=baseAmount*monthlyInsurancePerc/100;
    return installment+monthlyInsurance;
}

function calculateAmortization(baseAmount, anualRate, monthsDeadline, monthlyInsurancePerc, amortizationType, extraPayments, firstPaymentDate){
    if (baseAmount<=0||monthsDeadline<=0){
        return [];
    }
    const monthlyRate=calculateMonthlyRate(anualRate);
    const fixedCapital=baseAmount/monthsDeadline;
    const fixedInstallment=monthlyRate===0?fixedCapital:baseAmount*monthlyRate/(1-Math.pow(1+monthlyRate,-monthsDeadline));
    const balanceTolerance=0.000001;
    let balance=baseAmount;
    const payments=[];
    const startDate=firstPaymentDate?new Date(firstPaymentDate+"T00:00:00"):new Date();

    for (let month=1; month<=monthsDeadline && balance>balanceTolerance; month++){
        const initialBalance=balance;
        const interest=initialBalance*monthlyRate;
        const insurance=initialBalance*monthlyInsurancePerc/100;
        let capital=amortizationType==="Capital fijo"?fixedCapital:fixedInstallment-interest;
        capital=Math.min(Math.max(capital,0),initialBalance);
        const balanceAfterInstallment=Math.max(0,initialBalance-capital);
        const scheduledExtra=extraPayments[month]||0;
        const extraPayment=Math.min(scheduledExtra,balanceAfterInstallment);
        const finalBalance=Math.max(0,balanceAfterInstallment-extraPayment);
        const paymentDate=new Date(startDate);
        const paymentDay=startDate.getDate();
        paymentDate.setDate(1);
        paymentDate.setMonth(startDate.getMonth()+month-1);
        paymentDate.setDate(Math.min(paymentDay,new Date(paymentDate.getFullYear(),paymentDate.getMonth()+1,0).getDate()));

        payments.push({
            month:month,
            date:paymentDate.toLocaleDateString("es-DO"),
            initialBalance:initialBalance,
            installment:capital+interest,
            capital:capital,
            interest:interest,
            insurance:insurance,
            extraPayment:extraPayment,
            totalPayment:capital+interest+insurance+extraPayment,
            finalBalance:finalBalance
        });
        balance=finalBalance;
    }

    return payments;
}
