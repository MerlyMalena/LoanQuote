// Se ejecuta solo cuando el HTML carga completamente
$(document).ready(function(){  

// Datos generales
// Seleccionar moneda 
function selectCurrency() {
  let selectedOption = $("#currency").val();
   return selectedOption;
}


// Condiciones financieras
$("#requestedAmount, #downPayment").on('input',()=>{
const requestedAmount=parseFloat(document.getElementById("requestedAmount").value);
const downPayment=parseFloat(document.querySelector("#downPayment").value);

if (requestedAmount<downPayment)
{
    alert('El monto solicitado debe ser mayor al pago inicial');
    document.getElementById("downPayment").value=0;
    document.getElementById("downPayment").focus();
}

// Le da al input el nuevo valor
$('#financedAmountDisplay').val(calculateFinancedAmount());
});


// Si el usuario marca Aplicar seguro, el campo Porcentaje de seguro mensual debe habilitarse y convertirse en requerido.
$("#applyInsurance").on('change', function(){
   const isChecked=$(this).is(':checked');

   if (!isChecked){
    $("#insurancePercentage").prop('disabled',true);
    $("#insurancePercentage").prop('required',false);
   }
   else {
    $("#insurancePercentage").prop('disabled',false);
    $("#insurancePercentage").prop('required',true);
   }
  
});

// Reglas de comisión administrativa

function actualizarMonto() {
  let selectedOption = $("#adminFeeType").val();
  const financedAmount = calculateFinalFinancedAmount(selectedOption);
  $("#resMontoFinanciado").text(formatCurrency(financedAmount, selectCurrency()));
}

$("#btnAddExtraPayment").on('click', function(){
   const row=$('<tr><td><input type="number" class="form-control" name="extraPaymentMonth" min="1" step="1"></td><td><input type="number" class="form-control" name="extraPaymentAmount" min="0" step="0.01"></td><td><input type="text" class="form-control" name="extraPaymentDescription"></td><td class="text-center"><button type="button" class="btn btn-danger btn-sm">Eliminar</button></td></tr>');
   row.find("button").on('click', function(){
      row.remove();
      $("#noExtraPaymentsMsg").toggle($("#extraPaymentsContainer tr").length===0);
   });
   $("#extraPaymentsContainer").append(row);
   $("#noExtraPaymentsMsg").hide();
});

// Generar resumen de cotización
$("#btnGenerateQuote").on('click', function(){
   const requestedAmount=parseFloat(document.querySelector("#requestedAmount").value)||0;
   const downPayment=parseFloat(document.querySelector("#downPayment").value)||0;
   const adminFee=parseFloat(document.querySelector("#adminFee").value)||0;
   const anualRate=parseFloat(document.querySelector("#annualInterestRate").value)||0;
   const requestedMonths=parseInt(document.querySelector("#termMonths").value)||12;
   const monthsDeadline=Math.min(Math.max(requestedMonths,1),360);
   const monthlyInsurancePerc=$("#applyInsurance").is(':checked')?parseFloat(document.querySelector("#insurancePercentage").value)||0:0;
   const selectedOption=$("#adminFeeType").val();
   const baseAmount=calculateFinalFinancedAmount(selectedOption);
   const extraPayments={};

   if (baseAmount<=0){
      alert("Ingresa un monto solicitado mayor que cero para generar la tabla.");
      return;
   }
   if (document.querySelector("#quoteDate").value&&document.querySelector("#expiryDate").value&&!validateQuoteDates()){
      return;
   }

   $("input[name='extraPaymentMonth']").each(function(index){
      const month=parseInt(this.value);
      const amount=parseFloat(document.querySelectorAll("input[name='extraPaymentAmount']")[index].value)||0;
      if (month>=1&&month<=monthsDeadline&&amount>0){
         extraPayments[month]=(extraPayments[month]||0)+amount;
      }
   });

   const currency = selectCurrency();
   $("#resMontoSolicitado").text(formatCurrency(requestedAmount, currency));
   $("#resPagoInicial").text(formatCurrency(downPayment, currency));
   $("#resMontoBase").text(formatCurrency(calculateBaseAmountWithFee(), currency)); //Es un strong
   $("#resComision").text(formatCurrency(adminFee, currency));
   $("#resTasaAnual").text(anualRate.toFixed(2)+"%");
   $("#resTasaMensual").text((calculateMonthlyRate(anualRate)*100).toFixed(2)+"%");
   $("#resPlazoMeses").text(monthsDeadline);
   $("#resCuotaInicial").text(formatCurrency(calculateFixedInstallment(
      anualRate,
      monthsDeadline,
      monthlyInsurancePerc
   ), currency));
   actualizarMonto();

   const payments=calculateAmortization(
      baseAmount,
      anualRate,
      monthsDeadline,
      monthlyInsurancePerc,
      document.querySelector("#amortizationType").value,
      extraPayments,
      document.querySelector("#firstPaymentDate").value
   );
   $("#amortizationContainer").html(payments.map(payment=>`<tr>
      <td>${payment.month}</td>
      <td>${payment.date}</td>
      <td>${formatCurrency(payment.initialBalance, currency)}</td>
      <td>${formatCurrency(payment.installment, currency)}</td>
      <td>${formatCurrency(payment.capital, currency)}</td>
      <td>${formatCurrency(payment.interest, currency)}</td>
      <td>${formatCurrency(payment.insurance, currency)}</td>
      <td>${formatCurrency(payment.extraPayment, currency)}</td>
      <td>${formatCurrency(payment.totalPayment, currency)}</td>
      <td>${formatCurrency(payment.finalBalance, currency)}</td>
   </tr>`).join(''));
});
});
