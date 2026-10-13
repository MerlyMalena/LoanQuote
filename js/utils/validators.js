function validateQuoteDates(){
    var expiryDate=document.getElementById("expiryDate").value;
    var quoteDate=document.getElementById("quoteDate").value;

    if (!expiryDate || !quoteDate) {
        return false;
    }
    if (expiryDate < quoteDate){
        alert("La fecha de vencimiento debe ser mayor o igual a la fecha de cotizacion");
        return false;
    }
    return true;
}
