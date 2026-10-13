var expirydate=document.getElementById("expirydate").value;
var quoteDate=document.getElementById("quoteDate").value;

if (!expirydate || typeof expirydate !== 'string') {
    alert("La fecha de vencimiento es invalida");
}
if (expirydate >= quoteDate){
    alert ("La fecha  de vencimiento debe ser mayor o igual a la fecha de cotizacion");
}
