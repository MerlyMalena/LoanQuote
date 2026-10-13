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
         income: monthlyIncome
      },
      quote: {
         number: $("#quoteNumber").val().trim(),
         loanType: $("#loanType").val(),
         date: $("#quoteDate").val(),
         expiryDate: $("#expiryDate").val(),
         status: $("#status").val(),
         currency: currency
      },
      conditions: {
         requestedAmount: requestedAmount,
         downPayment: downPayment,
         financedAmount: calculateFinancedAmount(),
         baseAmount: baseAmount,
         anualRate: anualRate,
         monthlyRate: calculateMonthlyRate(anualRate) * 100,
         termMonths: monthsDeadline,
         firstPaymentDate: firstPaymentDate,
         amortizationType: amortizationType
      },
      charges: {
         applyInsurance: $("#applyInsurance").is(':checked'),
         insurancePercentage: monthlyInsurancePerc,
         adminFee: adminFee,
         adminFeeType: selectedOption
      },
      summary: {
         cuotaInicial: cuotaInicialTotal,
         totalCapital: totalCapital,
         totalIntereses: totalIntereses,
         totalSeguro: totalSeguro,
         totalPagosExtra: totalPagosExtra,
         totalGeneral: totalGeneral,
         fechaFin: fechaFin,
         nivelEndeudamiento: nivelEndeudamiento
      },
      payments: payments,
      currency: currency
   });
});

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
