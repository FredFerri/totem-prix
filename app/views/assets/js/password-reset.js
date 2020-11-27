$('#form-password-reset').on('submit', function(e) {
	e.preventDefault();
	let password = $('#reset_password').val();
	if (password.length < 6) {
   		$('.error-message').find('.error-message-txt').text('Votre mot de passe doit contenir au moins 6 caractères');
   		$('.error-message').show();		
	}

	$.ajax({
	   url : '/password-reset',
	   type : 'POST',
	   data: {password: $('#reset_password').val(), id: $('#userId').val()},
	   dataType : 'json',
	   success : function(resultat, statut) {
	   		$('.success-modal h3').text('Mot de passe enregistré');
	   		$('.btn-validate').text('Se connecter');
	   		$('.success-modal').show();	
	   },
	   error : function(resultat, statut, erreur){
	   		$('.error-message').find('.error-message-txt').text(resultat.responseJSON.message);
	   		$('.error-message').show();
	   }

	});	
})