// Se ejecuta solo cuando el HTML carga completamente
$(document).ready(function(){  

// Datos generales
// Seleccionar moneda 
function selectCurrency() {
  let selectedOption = $("#currency").val();
   return selectedOption;
}


// Obtiene el mapa de pagos extraordinarios
function getExtraPaymentsMap() {
  const extraPayments = {};
  const termMonths = parseInt($("#termMonths").val()) || 360;
  $("input[name='extraPaymentMonth']").each(function(index) {
     const month = parseInt(this.value);
     const amount = parseFloat($("input[name='extraPaymentAmount']").eq(index).val()) || 0;
     if (month >= 1 && month <= termMonths && amount > 0) {
        extraPayments[month] = (extraPayments[month] || 0) + amount;
     }
  });
  return extraPayments;
}

// Recalcula automáticamente la tabla de amortización y el resumen en tiempo real
function recalcularTodoEnTiempoReal() {
  const requestedAmount = parseFloat($("#requestedAmount").val()) || 0;
  const downPayment = parseFloat($("#downPayment").val()) || 0;
  const adminFee = parseFloat($("#adminFee").val()) || 0;
  const anualRate = parseFloat($("#annualInterestRate").val()) || 0;
  const termMonths = parseInt($("#termMonths").val()) || 0;
  const monthsDeadline = Math.min(Math.max(termMonths, 1), 360);
  const applyInsurance = $("#applyInsurance").is(':checked');
  const monthlyInsurancePerc = applyInsurance ? (parseFloat($("#insurancePercentage").val()) || 0) : 0;
  const selectedOption = $("#adminFeeType").val();
  const baseAmount = calculateFinalFinancedAmount(selectedOption);
  const extraPayments = getExtraPaymentsMap();
  const currency = selectCurrency();
  const amortizationType = $("#amortizationType").val();
  const firstPaymentDate = $("#firstPaymentDate").val();
  const monthlyIncome = parseFloat($("#monthlyIncome").val()) || 0;

  // Actualiza el campo calculado del monto financiado
  $("#financedAmountDisplay").val(calculateFinancedAmount().toFixed(2));

  // Si los datos mínimos para amortizar no son válidos, limpia tabla
  if (requestedAmount <= 0 || downPayment >= requestedAmount || termMonths <= 0) {
     return null;
  }

  // Genera la tabla de pagos
  const payments = calculateAmortization(
     baseAmount,
     anualRate,
     monthsDeadline,
     monthlyInsurancePerc,
     amortizationType,
     extraPayments,
     firstPaymentDate
  );

  if (payments.length > 0) {
     // Renderiza la tabla de amortización en tiempo real
     $("#amortizationContainer").html(payments.map(p => `<tr>
        <td>${p.month}</td>
        <td>${p.date}</td>
        <td>${formatCurrency(p.initialBalance, currency)}</td>
        <td>${formatCurrency(p.installment, currency)}</td>
        <td>${formatCurrency(p.capital, currency)}</td>
        <td>${formatCurrency(p.interest, currency)}</td>
        <td>${formatCurrency(p.insurance, currency)}</td>
        <td>${formatCurrency(p.extraPayment, currency)}</td>
        <td>${formatCurrency(p.totalPayment, currency)}</td>
        <td>${formatCurrency(p.finalBalance, currency)}</td>
     </tr>`).join(''));

     // Totales acumulados
     const cuotasGeneradas = payments.length;
     const totalCapital = payments.reduce((sum, p) => sum + p.capital, 0);
     const totalIntereses = payments.reduce((sum, p) => sum + p.interest, 0);
     const totalSeguro = payments.reduce((sum, p) => sum + p.insurance, 0);
     const totalPagosExtra = payments.reduce((sum, p) => sum + p.extraPayment, 0);
     const totalCuotasPagadas = payments.reduce((sum, p) => sum + p.totalPayment, 0);
     const cuotaInicialTotal = payments[0].totalPayment;

     const comisionInicial = selectedOption === "Cobrar como cargo inicial" ? adminFee : 0;
     const totalGeneral = totalCuotasPagadas + comisionInicial;
     const fechaFin = payments[payments.length - 1].date || "-";

     // Nivel de endeudamiento
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

     // Actualiza los valores en el resumen de cálculos
     $("#resMontoSolicitado").text(formatCurrency(requestedAmount, currency));
     $("#resPagoInicial").text(formatCurrency(downPayment, currency));
     $("#resComision").text(formatCurrency(adminFee, currency));
     $("#resMontoFinanciado").text(formatCurrency(calculateFinancedAmount(), currency));
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

     return {
        requestedAmount, downPayment, adminFee, anualRate, monthsDeadline,
        monthlyInsurancePerc, selectedOption, baseAmount, extraPayments,
        currency, amortizationType, firstPaymentDate, monthlyIncome,
        payments, cuotasGeneradas, totalCapital, totalIntereses, totalSeguro,
        totalPagosExtra, totalCuotasPagadas, cuotaInicialTotal, totalGeneral,
        fechaFin, nivelEndeudamiento
     };
  }

  return null;
}

// Escucha cambios en todos los campos que afectan los cálculos para actualizar en tiempo real
$("#requestedAmount, #downPayment, #annualInterestRate, #termMonths, #firstPaymentDate, #amortizationType, #applyInsurance, #insurancePercentage, #adminFee, #adminFeeType, #currency, #monthlyIncome").on('input change', function() {
  const requestedAmount = parseFloat($("#requestedAmount").val()) || 0;
  const downPayment = parseFloat($("#downPayment").val()) || 0;

  if (downPayment >= requestedAmount && requestedAmount > 0) {
    setFieldError('#downPayment', 'El pago inicial debe ser menor que el monto solicitado.');
  } else {
    clearFieldError('#downPayment');
  }

  recalcularTodoEnTiempoReal();
});

// Manejo del checkbox de seguro mensual
$("#applyInsurance").on('change', function() {
  const isChecked = $(this).is(':checked');
  if (!isChecked) {
    $("#insurancePercentage").val('').prop('disabled', true).prop('required', false);
  } else {
    $("#insurancePercentage").prop('disabled', false).prop('required', true);
  }
  recalcularTodoEnTiempoReal();
});

// Agregar pago extraordinario dinámicamente
$("#btnAddExtraPayment").on('click', function() {
   const row = $('<tr><td><input type="number" class="form-control" name="extraPaymentMonth" min="1" step="1"></td><td><input type="number" class="form-control" name="extraPaymentAmount" min="0" step="0.01"></td><td><input type="text" class="form-control" name="extraPaymentDescription"></td><td class="text-center"><button type="button" class="btn btn-danger btn-sm">Eliminar</button></td></tr>');
   row.find("button").on('click', function() {
      row.remove();
      $("#noExtraPaymentsMsg").toggle($("#extraPaymentsContainer tr").length === 0);
      recalcularTodoEnTiempoReal();
   });
   $("#extraPaymentsContainer").append(row);
   $("#noExtraPaymentsMsg").hide();
});

// Detectar cambios dentro de la tabla de pagos extraordinarios
$("#extraPaymentsContainer").on('input change', 'input', function() {
  recalcularTodoEnTiempoReal();
});

// Generar cotización al presionar el botón
$("#btnGenerateQuote").on('click', function() {
   // Valida todos los campos antes de continuar
   if (!validateAll()) {
      return;
   }

   const calc = recalcularTodoEnTiempoReal();
   if (!calc || !calc.payments || calc.payments.length === 0) {
      return;
   }

   // Genera la vista visual de la cotización generada
   renderGeneratedQuote({
      entity: {
         name: $("#entityName").val().trim(),
         rnc: $("#entityRnc").val().trim(),
         phone: $("#entityPhone").val().trim(),
         email: $("#entityEmail").val().trim(),
         address: $("#entityAddress").val().trim(),
         logo: $("#entityLogo").val().trim()
      },
      applicant: {
         name: $("#applicantName").val().trim(),
         id: $("#applicantId").val().trim(),
         phone: $("#applicantPhone").val().trim(),
         email: $("#applicantEmail").val().trim(),
         address: $("#applicantAddress").val().trim(),
         income: calc.monthlyIncome
      },
      quote: {
         number: $("#quoteNumber").val().trim(),
         loanType: $("#loanType").val(),
         date: $("#quoteDate").val(),
         expiryDate: $("#expiryDate").val(),
         status: $("#status").val(),
         currency: calc.currency
      },
      conditions: {
         requestedAmount: calc.requestedAmount,
         downPayment: calc.downPayment,
         financedAmount: calculateFinancedAmount(),
         baseAmount: calc.baseAmount,
         anualRate: calc.anualRate,
         monthlyRate: calculateMonthlyRate(calc.anualRate) * 100,
         termMonths: calc.monthsDeadline,
         firstPaymentDate: calc.firstPaymentDate,
         amortizationType: calc.amortizationType
      },
      charges: {
         applyInsurance: $("#applyInsurance").is(':checked'),
         insurancePercentage: calc.monthlyInsurancePerc,
         adminFee: calc.adminFee,
         adminFeeType: calc.selectedOption
      },
      summary: {
         cuotaInicial: calc.cuotaInicialTotal,
         totalCapital: calc.totalCapital,
         totalIntereses: calc.totalIntereses,
         totalSeguro: calc.totalSeguro,
         totalPagosExtra: calc.totalPagosExtra,
         totalGeneral: calc.totalGeneral,
         fechaFin: calc.fechaFin,
         nivelEndeudamiento: calc.nivelEndeudamiento
      },
      payments: calc.payments,
      currency: calc.currency
   });

   // Reinicia el formulario dejando la cotización visible
   resetFormAfterQuote();
});

// Reinicia el formulario después de generar la cotización
function resetFormAfterQuote() {
   // Limpia campos de texto y numéricos del formulario
   $("#loanForm")[0].reset();

   // Campo calculado debe mostrarse en cero con dos decimales
   $("#financedAmountDisplay").val("0.00");

   // Selects vuelven a su primera opción por defecto
   $("#loanType").prop('selectedIndex', 0);
   $("#currency").prop('selectedIndex', 0);
   $("#status").prop('selectedIndex', 0);
   $("#amortizationType").val("Cuota fija");
   $("#adminFeeType").val("Cobrar como cargo inicial");

   // Checkbox y seguro
   $("#applyInsurance").prop('checked', false);
   $("#insurancePercentage").val('').prop('disabled', true).prop('required', false);

   // Vacía listado de pagos extraordinarios
   $("#extraPaymentsContainer").empty();
   $("#noExtraPaymentsMsg").show();

   // Resumen de cálculos vuelve a cero
   $("#resMontoSolicitado").text("0.00");
   $("#resPagoInicial").text("0.00");
   $("#resComision").text("0.00");
   $("#resMontoFinanciado").text("0.00");
   $("#resMontoBase").text("0.00");
   $("#resTasaAnual").text("0.00%");
   $("#resTasaMensual").text("0.00%");
   $("#resPlazoMeses").text("0");
   $("#resCuotasGeneradas").text("0");
   $("#resCuotaInicial").text("0.00");
   $("#resTotalCapital").text("0.00");
   $("#resTotalIntereses").text("0.00");
   $("#resTotalSeguro").text("0.00");
   $("#resTotalPagosExtra").text("0.00");
   $("#resTotalCuotas").text("0.00");
   $("#resTotalGeneral").text("0.00");
   $("#resFechaFin").text("-");
   $("#resRelacionCuotaIngreso").text("0.00%");
   $("#resNivelEndeudamiento").text("-").removeClass("bg-success bg-warning bg-danger text-dark").addClass("bg-secondary");

   // La tabla de amortización del formulario queda vacía
   $("#amortizationContainer").html('<tr><td colspan="10" class="text-center py-4 text-muted">Complete los datos obligatorios para ver la tabla de amortización.</td></tr>');

   // Los mensajes de error desaparecen
   clearAllErrors();
}

// Construye la vista de la cotización generada en el contenedor final
function renderGeneratedQuote(data) {
   const container = $("#quoteGeneratedContainer");
   // Limpia cotizaciones anteriores
   container.empty();

   const now = new Date();
   const fechaGeneracion = now.toLocaleDateString("es-DO") + " " + now.toLocaleTimeString("es-DO");

   // Encabezado con logo y datos de la entidad
   let logoHtml = "";
   if (data.entity.logo && isValidUrl(data.entity.logo)) {
      logoHtml = `<div class="text-center text-md-start me-md-4 mb-3 mb-md-0">
         <img src="${data.entity.logo}" alt="Logo entidad" style="max-height: 80px; max-width: 160px; object-fit: contain;">
      </div>`;
   }

   const encabezadoHtml = `
      <div class="d-flex flex-column flex-md-row align-items-center justify-content-between border-bottom pb-4 mb-4">
         <div class="d-flex flex-column flex-md-row align-items-center">
            ${logoHtml}
            <div class="text-center text-md-start">
               <h3 class="fw-bold mb-1 text-success">${data.entity.name}</h3>
               <p class="text-muted mb-0 small"><strong>RNC:</strong> ${data.entity.rnc} | <strong>Tel:</strong> ${data.entity.phone}</p>
               <p class="text-muted mb-0 small"><strong>Correo:</strong> ${data.entity.email}</p>
               <p class="text-muted mb-0 small"><strong>Dirección:</strong> ${data.entity.address}</p>
            </div>
         </div>
         <div class="text-center text-md-end mt-3 mt-md-0">
            <span class="badge bg-success-subtle text-success-emphasis border border-success-subtle px-3 py-2 fs-6">Cotización: ${data.quote.number}</span>
            <div class="small text-muted mt-1">Estado: <strong>${data.quote.status}</strong></div>
         </div>
      </div>
   `;

   // Datos del solicitante y datos de la cotización
   const datosPrincipalesHtml = `
      <div class="row g-4 mb-4">
         <div class="col-md-6">
            <div class="p-3 border rounded-3 bg-light h-100">
               <h5 class="fw-bold text-success-emphasis border-bottom pb-2">Datos del solicitante</h5>
               <ul class="list-unstyled mb-0 small lh-lg">
                  <li><strong>Nombre:</strong> ${data.applicant.name}</li>
                  <li><strong>Identificación:</strong> ${data.applicant.id}</li>
                  <li><strong>Teléfono:</strong> ${data.applicant.phone}</li>
                  <li><strong>Correo:</strong> ${data.applicant.email}</li>
                  <li><strong>Dirección:</strong> ${data.applicant.address}</li>
                  <li><strong>Ingreso mensual:</strong> ${formatCurrency(data.applicant.income, data.currency)}</li>
               </ul>
            </div>
         </div>
         <div class="col-md-6">
            <div class="p-3 border rounded-3 bg-light h-100">
               <h5 class="fw-bold text-success-emphasis border-bottom pb-2">Datos de la cotización</h5>
               <ul class="list-unstyled mb-0 small lh-lg">
                  <li><strong>Número:</strong> ${data.quote.number}</li>
                  <li><strong>Tipo de préstamo:</strong> ${data.quote.loanType}</li>
                  <li><strong>Fecha cotización:</strong> ${data.quote.date}</li>
                  <li><strong>Fecha vencimiento:</strong> ${data.quote.expiryDate}</li>
                  <li><strong>Estado:</strong> ${data.quote.status}</li>
                  <li><strong>Moneda:</strong> ${data.quote.currency}</li>
               </ul>
            </div>
         </div>
      </div>
   `;

   // Condiciones financieras y Cargos adicionales
   const condicionesHtml = `
      <div class="row g-4 mb-4">
         <div class="col-md-6">
            <div class="p-3 border rounded-3 bg-light h-100">
               <h5 class="fw-bold text-success-emphasis border-bottom pb-2">Condiciones financieras</h5>
               <ul class="list-unstyled mb-0 small lh-lg">
                  <li><strong>Monto solicitado:</strong> ${formatCurrency(data.conditions.requestedAmount, data.currency)}</li>
                  <li><strong>Pago inicial:</strong> ${formatCurrency(data.conditions.downPayment, data.currency)}</li>
                  <li><strong>Monto financiado:</strong> ${formatCurrency(data.conditions.financedAmount, data.currency)}</li>
                  <li><strong>Monto base del préstamo:</strong> ${formatCurrency(data.conditions.baseAmount, data.currency)}</li>
                  <li><strong>Tasa anual:</strong> ${data.conditions.anualRate.toFixed(2)}% (Mensual: ${data.conditions.monthlyRate.toFixed(2)}%)</li>
                  <li><strong>Plazo:</strong> ${data.conditions.termMonths} meses</li>
                  <li><strong>Fecha primer pago:</strong> ${data.conditions.firstPaymentDate}</li>
                  <li><strong>Tipo de amortización:</strong> ${data.conditions.amortizationType}</li>
               </ul>
            </div>
         </div>
         <div class="col-md-6">
            <div class="p-3 border rounded-3 bg-light h-100">
               <h5 class="fw-bold text-success-emphasis border-bottom pb-2">Cargos adicionales y seguro</h5>
               <ul class="list-unstyled mb-0 small lh-lg">
                  <li><strong>Seguro mensual:</strong> ${data.charges.applyInsurance ? "Aplicado (" + data.charges.insurancePercentage.toFixed(2) + "%)" : "No aplicado"}</li>
                  <li><strong>Comisión administrativa:</strong> ${formatCurrency(data.charges.adminFee, data.currency)}</li>
                  <li><strong>Forma de aplicar comisión:</strong> ${data.charges.adminFeeType}</li>
               </ul>
            </div>
         </div>
      </div>
   `;

   // Resumen financiero
   const resumenHtml = `
      <div class="p-3 border rounded-3 bg-light mb-4">
         <h5 class="fw-bold text-success-emphasis border-bottom pb-2">Resumen financiero</h5>
         <div class="row row-cols-2 row-cols-md-4 g-3 small">
            <div><span class="text-muted d-block">Primera cuota:</span> <strong>${formatCurrency(data.summary.cuotaInicial, data.currency)}</strong></div>
            <div><span class="text-muted d-block">Total capital:</span> <strong>${formatCurrency(data.summary.totalCapital, data.currency)}</strong></div>
            <div><span class="text-muted d-block">Total intereses:</span> <strong>${formatCurrency(data.summary.totalIntereses, data.currency)}</strong></div>
            <div><span class="text-muted d-block">Total seguro:</span> <strong>${formatCurrency(data.summary.totalSeguro, data.currency)}</strong></div>
            <div><span class="text-muted d-block">Pagos extraordinarios:</span> <strong>${formatCurrency(data.summary.totalPagosExtra, data.currency)}</strong></div>
            <div><span class="text-muted d-block">Total general a pagar:</span> <strong class="text-success">${formatCurrency(data.summary.totalGeneral, data.currency)}</strong></div>
            <div><span class="text-muted d-block">Fecha final estimada:</span> <strong>${data.summary.fechaFin}</strong></div>
            <div><span class="text-muted d-block">Nivel de endeudamiento:</span> <strong>${data.summary.nivelEndeudamiento}</strong></div>
         </div>
      </div>
   `;

   // Tabla de amortización en la cotización generada
   const filasTablaHtml = data.payments.map(p => `<tr>
      <td>${p.month}</td>
      <td>${p.date}</td>
      <td>${formatCurrency(p.initialBalance, data.currency)}</td>
      <td>${formatCurrency(p.installment, data.currency)}</td>
      <td>${formatCurrency(p.capital, data.currency)}</td>
      <td>${formatCurrency(p.interest, data.currency)}</td>
      <td>${formatCurrency(p.insurance, data.currency)}</td>
      <td>${formatCurrency(p.extraPayment, data.currency)}</td>
      <td>${formatCurrency(p.totalPayment, data.currency)}</td>
      <td>${formatCurrency(p.finalBalance, data.currency)}</td>
   </tr>`).join('');

   const tablaHtml = `
      <div class="mb-4">
         <h5 class="fw-bold text-success-emphasis mb-3">Tabla de amortización</h5>
         <div class="table-responsive">
            <table class="table table-sm table-striped table-bordered text-end align-middle">
               <thead class="table-secondary text-center">
                  <tr>
                     <th>#</th>
                     <th>Fecha</th>
                     <th>Balance inicial</th>
                     <th>Cuota base</th>
                     <th>Capital</th>
                     <th>Interés</th>
                     <th>Seguro</th>
                     <th>Pago extra</th>
                     <th>Cuota total</th>
                     <th>Balance final</th>
                  </tr>
               </thead>
               <tbody>
                  ${filasTablaHtml}
               </tbody>
            </table>
         </div>
      </div>
   `;

   // Pie del documento con fecha y hora exacta
   const pieHtml = `
      <div class="text-center border-top pt-3 text-muted small">
         Fecha y hora de generación: <strong>${fechaGeneracion}</strong>
      </div>
   `;

   // Inyecta todo en el contenedor y muestra la sección
   container.html(encabezadoHtml + datosPrincipalesHtml + condicionesHtml + resumenHtml + tablaHtml + pieHtml);
   $("#quoteGeneratedSection").show();
   document.getElementById("quoteGeneratedSection").scrollIntoView({ behavior: 'smooth' });
}
});
