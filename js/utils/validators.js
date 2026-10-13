// Valida que el formato del correo sea correcto
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

// Revisa que la URL sea válida con http o https si se ingresó
function isValidUrl(url) {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return true;
  }
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

// Compara que la segunda fecha sea igual o mayor que la primera
function isDateEqualOrAfter(baseDateStr, targetDateStr) {
  if (!baseDateStr || !targetDateStr) return false;
  const base = new Date(`${baseDateStr}T00:00:00`);
  const target = new Date(`${targetDateStr}T00:00:00`);
  if (isNaN(base.getTime()) || isNaN(target.getTime())) return false;
  return target.getTime() >= base.getTime();
}

// Revisa que sea un número entero
function isStrictInteger(value) {
  if (value === '' || value === null || value === undefined) return false;
  const num = Number(value);
  return !isNaN(num) && Number.isInteger(num);
}

// El plazo debe ser entero entre 1 y 360 meses
function isValidLoanTerm(monthsValue) {
  if (!isStrictInteger(monthsValue)) return false;
  const m = Number(monthsValue);
  return m > 0 && m <= 360;
}

// El mes del pago extra no puede pasar del plazo total
function isValidExtraPaymentMonth(monthValue, maxTermMonths) {
  if (!isStrictInteger(monthValue)) return false;
  const m = Number(monthValue);
  const max = Number(maxTermMonths) || 360;
  return m > 0 && m <= max;
}

// El monto del pago extra debe ser mayor a cero
function isValidExtraPaymentAmount(amountValue) {
  if (amountValue === '' || amountValue === null || amountValue === undefined) return false;
  const a = parseFloat(amountValue);
  return !isNaN(a) && a > 0;
}

// Muestra el error debajo del campo
function setFieldError(inputSelector, message) {
  const $input = $(inputSelector);
  $input.addClass('is-invalid');
  
  let $feedback = $input.siblings('.invalid-feedback');
  if ($feedback.length === 0) {
    $feedback = $input.closest('.col, .col-md-4, .col-md-6, .col-12, td').find('.invalid-feedback');
  }
  if ($feedback.length > 0 && message) {
    $feedback.text(message);
  }
}

// Limpia el error del campo
function clearFieldError(inputSelector) {
  const $input = $(inputSelector);
  $input.removeClass('is-invalid');
}

// Quita todos los errores que estén marcados
function clearAllErrors() {
  $('.is-invalid').removeClass('is-invalid');
  $('#extraPaymentGlobalError').hide().text('');
}

// Valida que la fecha de vencimiento sea igual o mayor que la de cotización
function validateQuoteDates() {
  const quoteDate = $('#quoteDate').val();
  const expiryDate = $('#expiryDate').val();
  
  if (!quoteDate || !expiryDate) return false;
  
  if (!isDateEqualOrAfter(quoteDate, expiryDate)) {
    setFieldError('#expiryDate', 'La fecha de vencimiento debe ser igual o mayor que la fecha de cotización.');
    return false;
  }
  clearFieldError('#expiryDate');
  return true;
}

// Valida todo el formulario antes de generar la cotización
function validateAll(formData) {
  let isValid = true;
  clearAllErrors();

  // Datos de la entidad
  const entityName = $('#entityName').val() ? $('#entityName').val().trim() : '';
  if (!entityName) {
    setFieldError('#entityName', 'Debe ingresar el nombre de la entidad financiera.');
    isValid = false;
  }

  const entityRnc = $('#entityRnc').val() ? $('#entityRnc').val().trim() : '';
  if (!entityRnc) {
    setFieldError('#entityRnc', 'Debe ingresar el RNC o identificación.');
    isValid = false;
  }

  const entityPhone = $('#entityPhone').val() ? $('#entityPhone').val().trim() : '';
  if (!entityPhone) {
    setFieldError('#entityPhone', 'Debe ingresar el teléfono de la entidad.');
    isValid = false;
  }

  const entityEmail = $('#entityEmail').val() ? $('#entityEmail').val().trim() : '';
  if (!entityEmail || !isValidEmail(entityEmail)) {
    setFieldError('#entityEmail', 'Debe ingresar un correo electrónico válido.');
    isValid = false;
  }

  const entityLogo = $('#entityLogo').val() ? $('#entityLogo').val().trim() : '';
  if (entityLogo && !isValidUrl(entityLogo)) {
    setFieldError('#entityLogo', 'Debe ingresar una URL de logo válida.');
    isValid = false;
  }

  const entityAddress = $('#entityAddress').val() ? $('#entityAddress').val().trim() : '';
  if (!entityAddress) {
    setFieldError('#entityAddress', 'Debe ingresar la dirección de la entidad.');
    isValid = false;
  }

  // Datos del solicitante
  const applicantName = $('#applicantName').val() ? $('#applicantName').val().trim() : '';
  if (!applicantName) {
    setFieldError('#applicantName', 'Debe ingresar el nombre del solicitante.');
    isValid = false;
  }

  const applicantId = $('#applicantId').val() ? $('#applicantId').val().trim() : '';
  if (!applicantId) {
    setFieldError('#applicantId', 'Debe ingresar la identificación del solicitante.');
    isValid = false;
  }

  const applicantPhone = $('#applicantPhone').val() ? $('#applicantPhone').val().trim() : '';
  if (!applicantPhone) {
    setFieldError('#applicantPhone', 'Debe ingresar el teléfono del solicitante.');
    isValid = false;
  }

  const applicantEmail = $('#applicantEmail').val() ? $('#applicantEmail').val().trim() : '';
  if (!applicantEmail || !isValidEmail(applicantEmail)) {
    setFieldError('#applicantEmail', 'Debe ingresar un correo electrónico válido.');
    isValid = false;
  }

  const monthlyIncomeVal = $('#monthlyIncome').val();
  const monthlyIncome = parseFloat(monthlyIncomeVal);
  if (monthlyIncomeVal === '' || isNaN(monthlyIncome) || monthlyIncome <= 0) {
    setFieldError('#monthlyIncome', 'El ingreso mensual debe ser mayor que cero.');
    isValid = false;
  }

  const applicantAddress = $('#applicantAddress').val() ? $('#applicantAddress').val().trim() : '';
  if (!applicantAddress) {
    setFieldError('#applicantAddress', 'Debe ingresar la dirección del solicitante.');
    isValid = false;
  }

  // Datos generales del préstamo
  const loanType = $('#loanType').val();
  if (!loanType) {
    setFieldError('#loanType', 'Debe seleccionar un tipo de préstamo.');
    isValid = false;
  }

  const quoteNumber = $('#quoteNumber').val() ? $('#quoteNumber').val().trim() : '';
  if (!quoteNumber) {
    setFieldError('#quoteNumber', 'Debe ingresar el número de cotización.');
    isValid = false;
  }

  const currency = $('#currency').val();
  if (!currency) {
    setFieldError('#currency', 'Debe seleccionar una moneda.');
    isValid = false;
  }

  const quoteDate = $('#quoteDate').val();
  if (!quoteDate) {
    setFieldError('#quoteDate', 'Debe ingresar la fecha de cotización.');
    isValid = false;
  }

  const expiryDate = $('#expiryDate').val();
  if (!expiryDate) {
    setFieldError('#expiryDate', 'Debe ingresar la fecha de vencimiento.');
    isValid = false;
  } else if (quoteDate && !isDateEqualOrAfter(quoteDate, expiryDate)) {
    setFieldError('#expiryDate', 'La fecha de vencimiento debe ser igual o mayor que la fecha de cotización.');
    isValid = false;
  }

  const status = $('#status').val();
  if (!status) {
    setFieldError('#status', 'Debe seleccionar un estado.');
    isValid = false;
  }

  // Condiciones financieras
  const requestedAmountVal = $('#requestedAmount').val();
  const requestedAmount = parseFloat(requestedAmountVal);
  if (requestedAmountVal === '' || isNaN(requestedAmount) || requestedAmount <= 0) {
    setFieldError('#requestedAmount', 'El monto solicitado debe ser mayor que cero.');
    isValid = false;
  }

  const downPaymentVal = $('#downPayment').val();
  const downPayment = downPaymentVal !== '' ? parseFloat(downPaymentVal) : 0;
  if (isNaN(downPayment) || downPayment < 0) {
    setFieldError('#downPayment', 'El pago inicial no puede ser menor que cero.');
    isValid = false;
  } else if (!isNaN(requestedAmount) && requestedAmount > 0 && downPayment >= requestedAmount) {
    setFieldError('#downPayment', 'El pago inicial debe ser menor que el monto solicitado.');
    isValid = false;
  }

  const annualInterestRateVal = $('#annualInterestRate').val();
  const annualInterestRate = parseFloat(annualInterestRateVal);
  if (annualInterestRateVal === '' || isNaN(annualInterestRate) || annualInterestRate < 0 || annualInterestRate > 100) {
    setFieldError('#annualInterestRate', 'La tasa de interés anual debe estar entre 0 y 100.');
    isValid = false;
  }

  const termMonthsVal = $('#termMonths').val();
  if (!isValidLoanTerm(termMonthsVal)) {
    setFieldError('#termMonths', 'El plazo en meses debe ser un número entero mayor que cero y menor o igual que 360.');
    isValid = false;
  }
  const termMonths = parseInt(termMonthsVal) || 0;

  const firstPaymentDate = $('#firstPaymentDate').val();
  if (!firstPaymentDate) {
    setFieldError('#firstPaymentDate', 'Debe ingresar la fecha del primer pago.');
    isValid = false;
  } else if (quoteDate && !isDateEqualOrAfter(quoteDate, firstPaymentDate)) {
    setFieldError('#firstPaymentDate', 'La fecha del primer pago debe ser igual o mayor que la fecha de cotización.');
    isValid = false;
  }

  const amortizationType = $('#amortizationType').val();
  if (!amortizationType) {
    setFieldError('#amortizationType', 'Debe seleccionar un tipo de amortización.');
    isValid = false;
  }

  // Cargos adicionales y seguro
  const applyInsurance = $('#applyInsurance').is(':checked');
  if (applyInsurance) {
    const insurancePercentageVal = $('#insurancePercentage').val();
    const insurancePercentage = parseFloat(insurancePercentageVal);
    if (insurancePercentageVal === '' || isNaN(insurancePercentage)) {
      setFieldError('#insurancePercentage', 'Debe ingresar el porcentaje de seguro mensual.');
      isValid = false;
    } else if (insurancePercentage < 0 || insurancePercentage > 100) {
      setFieldError('#insurancePercentage', 'El porcentaje de seguro mensual debe estar entre 0 y 100.');
      isValid = false;
    }
  }

  const adminFeeVal = $('#adminFee').val();
  const adminFee = adminFeeVal !== '' ? parseFloat(adminFeeVal) : 0;
  if (isNaN(adminFee) || adminFee < 0) {
    setFieldError('#adminFee', 'La comisión administrativa no puede ser menor que cero.');
    isValid = false;
  }

  const adminFeeType = $('#adminFeeType').val();
  if (!adminFeeType) {
    setFieldError('#adminFeeType', 'Debe indicar la forma de aplicar la comisión.');
    isValid = false;
  }

  // Pagos extraordinarios
  $('#extraPaymentsContainer tr').each(function() {
    const $row = $(this);
    const $monthInput = $row.find("input[name='extraPaymentMonth']");
    const $amountInput = $row.find("input[name='extraPaymentAmount']");

    const monthVal = $monthInput.val();
    if (!isValidExtraPaymentMonth(monthVal, termMonths > 0 ? termMonths : 360)) {
      setFieldError($monthInput, 'El mes del pago extraordinario debe estar dentro del plazo del préstamo.');
      isValid = false;
    } else {
      clearFieldError($monthInput);
    }

    const amountVal = $amountInput.val();
    if (!isValidExtraPaymentAmount(amountVal)) {
      setFieldError($amountInput, 'El monto del pago extraordinario debe ser mayor que cero.');
      isValid = false;
    } else {
      clearFieldError($amountInput);
    }
  });

  return isValid;
}

// Para usar con el nombre que prefieras
const validateLoanForm = validateAll;

// Quita los mensajes de error cuando el usuario empieza a escribir o cambiar el valor
$(document).ready(function() {
  $('#loanForm').on('input change', 'input, select', function() {
    clearFieldError(this);
  });

  $('#extraPaymentsContainer').on('input change', 'input', function() {
    clearFieldError(this);
  });
});