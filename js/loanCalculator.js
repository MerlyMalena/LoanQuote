
function calculateFinancedAmount(){
    const requestedAmount=parseFloat(document.getElementById("requestedAmount").value);
        const downPayment=parseFloat(document.querySelector("#downPayment").value);
    let amountFinanced= requestedAmount-downPayment;
    return amountFinanced;
}

function calculateBaseAmountWithFee(){
  const adminFee= parseFloat(document.querySelector("#adminFee").value);
    let baseAmount=calculateFinancedAmount()+adminFee;
    return baseAmount;
}

function calculateFinalFinancedAmount(selectedOption){
   let montoFinanciado=1;
    if (selectedOption=="Cobrar como cargo inicial"){
        montoFinanciado=calculateFinancedAmount();
    }
    else {
        montoFinanciado=calculateBaseAmountWithFee();
    }
    return montoFinanciado;
}

