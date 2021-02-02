$('#form-create-user').on('submit', function(e) {
	e.preventDefault();
	if ($('#email').val() != $('#email2').val()) {
		$('.error-message').find('.error-message-txt').text('Les adresses renseignées ne correspondent pas');
	    $('.error-message').show();
	}
	else {		
		$.ajax({
		   url : '/user-manage',
		   type : 'POST',
		   data: {email: $('#email').val()},
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
	}
})