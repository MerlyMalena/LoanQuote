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