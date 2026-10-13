function validateAll(formData){
    validateQuoteDates();
    isValidEmail(formData.email);
    isValidUrl(formData.url);
    isDateEqualOrAfter(formData.baseDateStr, formData.targetDateStr);
}

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

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

function isValidUrl(url) {
  if (!url || url.trim() === "") {
    return true; 
  }

  try {
    const parsedUrl = new URL(url);
    // Protocolo http o https
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch (error) {
    return false; 
  }
}

function isDateEqualOrAfter(baseDateStr, targetDateStr) {
  // 1. Si alguna de las dos no existe, no es válida
  if (!baseDateStr || !targetDateStr) {
    return false;
  }

  const baseDate = new Date(`${baseDateStr}T00:00:00`);
  const targetDate = new Date(`${targetDateStr}T00:00:00`);

  if (isNaN(baseDate.getTime()) || isNaN(targetDate.getTime())) {
    return false;
  }

  return targetDate.getTime() >= baseDate.getTime();
}

// Convertir a enteros

function isStrictInteger(value) {
  if (value === "" || value === null || value === undefined) {
    return false;
  }
  const num = Number(value);
  return !isNaN(num) && Number.isInteger(num);
}

// Verificar si el plazo en meses es válido
function isValidLoanTerm(monthsValue) {
  if (!isStrictInteger(monthsValue)) {
    return false;
  }

  const months = Number(monthsValue);
  return months > 0 && months <= 360;
}

// Validar que pago extraordinario debe ser mayor que cero (> 0) y no superar el plazo total del préstamo

function isValidExtraPaymentMonth(extraMonthValue, maxTermMonths) {
  if (!isStrictInteger(extraMonthValue)) {
    return false;
  }

  const extraMonth = Number(extraMonthValue);
  
  if (maxTermMonths !== undefined) {
    return extraMonth > 0 && extraMonth <= Number(maxTermMonths);
  }

  return extraMonth > 0;
}