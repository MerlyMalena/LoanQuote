// Se ejecuta solo cuando el HTML carga completamente
$(document).ready(function(){  
$("#requestedAmount, #downPayment").on('input',()=>{
const requestedAmount=parseFloat(document.getElementById("requestedAmount").value);
const downPayment=parseFloat(document.querySelector("#downPayment").value);

while (requestedAmount<downPayment)
{
    alert('El monto solicitado debe ser mayor al pago inicial');
    document.getElementById("downPayment").val(0);
    document.getElementById("downPayment").focus();
}

let amountFinanced= requestedAmount-downPayment;


// Le da al input el nuevo valor
$('#financedAmountDisplay').val(amountFinanced);
});
});