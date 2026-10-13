// Se ejecuta solo cuando el HTML carga completamente
$(document).ready(function(){  

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
   }
   else {
    $("#insurancePercentage").prop('disabled',false);
   }
  
});

// Reglas de comisión administrativa

function actualizarMonto() {
  let selectedOption = $("#adminFeeType").val();
  const financedAmount = calculateFinalFinancedAmount(selectedOption);
  $("#resMontoFinanciado").text(financedAmount.toFixed(2));
}

// Generar resumen de cotización
$("#btnGenerateQuote").on('click', function(){
   $("#resMontoSolicitado").text(parseFloat(document.querySelector("#requestedAmount").value));
   $("#resPagoInicial").text(parseFloat(document.querySelector("#downPayment").value));
   $("#resMontoBase").text(calculateBaseAmountWithFee()); //Es un strong
   $("#resComision").text(parseFloat(document.querySelector("#adminFee").value));
   actualizarMonto();
});
});