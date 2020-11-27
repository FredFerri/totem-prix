$('#form-password-reset').on('submit', function(e) {
	e.preventDefault();

	$.ajax({
	   url : '/password-reset-verif',
	   type : 'POST',
	   data: {email: $('#reset_email').val()},
	   dataType : 'json',
	   success : function(resultat, statut){
	   		$('.success-message').find('.success-message-txt').text(resultat.message);
	    	$('.success-message').show();
	   },
	   error : function(resultat, statut, erreur){
	   		$('.error-message').find('.error-message-txt').text(resultat.responseJSON.message);
	   		$('.error-message').show();
	   }

	});	
})