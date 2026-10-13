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
  const requestedAmount = parseFloat(document.getElementById("requestedAmount").value) || 0;
  const downPayment = parseFloat(document.querySelector("#downPayment").value) || 0;

  if (downPayment >= requestedAmount && requestedAmount > 0) {
    setFieldError('#downPayment', 'El pago inicial debe ser menor que el monto solicitado.');
  } else {
    clearFieldError('#downPayment');
  }

  // Le da al input el nuevo valor
  $('#financedAmountDisplay').val(calculateFinancedAmount().toFixed(2));
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
   // Valida todos los campos antes de continuar
   if (!validateAll()) {
      return;
   }

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

   $("input[name='extraPaymentMonth']").each(function(index){
      const month=parseInt(this.value);
      const amount=parseFloat(document.querySelectorAll("input[name='extraPaymentAmount']")[index].value)||0;
      if (month>=1&&month<=monthsDeadline&&amount>0){
         extraPayments[month]=(extraPayments[month]||0)+amount;
      }
   });

   const currency = selectCurrency();
   const amortizationType = document.querySelector("#amortizationType").value;
   const firstPaymentDate = document.querySelector("#firstPaymentDate").value;
   const monthlyIncome = parseFloat(document.querySelector("#monthlyIncome").value) || 0;

   // Calcula la tabla de amortización
   const payments = calculateAmortization(
      baseAmount,
      anualRate,
      monthsDeadline,
      monthlyInsurancePerc,
      amortizationType,
      extraPayments,
      firstPaymentDate
   );

   // Renderiza la tabla de amortización
   $("#amortizationContainer").html(payments.map(payment => `<tr>
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

   // Totales acumulados para el resumen
   const cuotasGeneradas = payments.length;
   const totalCapital = payments.reduce((sum, p) => sum + p.capital, 0);
   const totalIntereses = payments.reduce((sum, p) => sum + p.interest, 0);
   const totalSeguro = payments.reduce((sum, p) => sum + p.insurance, 0);
   const totalPagosExtra = payments.reduce((sum, p) => sum + p.extraPayment, 0);
   const totalCuotasPagadas = payments.reduce((sum, p) => sum + (p.installment + p.insurance), 0);
   const cuotaInicialTotal = payments.length > 0 ? (payments[0].installment + payments[0].insurance) : 0;

   // Si la comisión se cobró como cargo inicial, se suma al total general a pagar
   const comisionInicial = selectedOption === "Cobrar como cargo inicial" ? adminFee : 0;
   const totalGeneral = totalCuotasPagadas + comisionInicial;

   // Fecha de la última cuota generada
   const fechaFin = payments.length > 0 ? payments[payments.length - 1].date : "-";

   // Relación cuota / ingreso y nivel de endeudamiento
   let relacionCuotaIngreso = 0;
   let nivelEndeudamiento = "-";
   let badgeClass = "bg-secondary";

   if (monthlyIncome > 0 && cuotaInicialTotal > 0) {
      relacionCuotaIngreso = (cuotaInicialTotal / monthlyIncome) * 100;
      if (relacionCuotaIngreso <= 30) {
         nivelEndeudamiento = "Nivel saludable";
         badgeClass = "bg-success";
      } else if (relacionCuotaIngreso <= 50) {
         nivelEndeudamiento = "Nivel de riesgo medio";
         badgeClass = "bg-warning text-dark";
      } else {
         nivelEndeudamiento = "Nivel de riesgo alto";
         badgeClass = "bg-danger";
      }
   }

   // Actualiza todos los campos del resumen de cálculos
   $("#resMontoSolicitado").text(formatCurrency(requestedAmount, currency));
   $("#resPagoInicial").text(formatCurrency(downPayment, currency));
   $("#resComision").text(formatCurrency(adminFee, currency));
   $("#resMontoBase").text(formatCurrency(baseAmount, currency));
   $("#resTasaAnual").text(anualRate.toFixed(2) + "%");
   $("#resTasaMensual").text((calculateMonthlyRate(anualRate) * 100).toFixed(2) + "%");
   $("#resPlazoMeses").text(monthsDeadline);
   $("#resCuotasGeneradas").text(cuotasGeneradas);
   $("#resCuotaInicial").text(formatCurrency(cuotaInicialTotal, currency));
   $("#resTotalCapital").text(formatCurrency(totalCapital, currency));
   $("#resTotalIntereses").text(formatCurrency(totalIntereses, currency));
   $("#resTotalSeguro").text(formatCurrency(totalSeguro, currency));
   $("#resTotalPagosExtra").text(formatCurrency(totalPagosExtra, currency));
   $("#resTotalCuotas").text(formatCurrency(totalCuotasPagadas, currency));
   $("#resTotalGeneral").text(formatCurrency(totalGeneral, currency));
   $("#resFechaFin").text(fechaFin);
   $("#resRelacionCuotaIngreso").text(relacionCuotaIngreso.toFixed(2) + "%");
   $("#resNivelEndeudamiento").text(nivelEndeudamiento).removeClass("bg-secondary bg-success bg-warning bg-danger text-dark").addClass(badgeClass);
   actualizarMonto();
});
});
