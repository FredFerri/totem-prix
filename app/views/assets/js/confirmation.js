$('#confirm_submit').on('click', function(e) {
	e.preventDefault();
	let civil = $('.civil:checked').val();
	if (!civil) {
		$('.error-message').find('.error-message-txt').text('Vous devez indiquer une civilité');
	   	$('.error-message').show();						
	}
	else if ($('#password').val().length < 6) {
		$('.error-message').find('.error-message-txt').text('Votre mot de passe doit contenir au moins 6 caractères');
	   	$('.error-message').show();
	}
	else if ($('#tel').val().length < 10 || $('#tel').val().length > 13) {
		$('.error-message').find('.error-message-txt').text('Numéro de téléphone non valide');
	   	$('.error-message').show();		
	}
	else if ($('#tva').val().length > 0 && $('#tva').val().length < 11) {
		$('.error-message').find('.error-message-txt').text('Numéro de TVA non valide');
	   	$('.error-message').show();				
	}
	else if ($('#siret').val().length < 14) {
		$('.error-message').find('.error-message-txt').text('Numéro SIRET non valide');
	   	$('.error-message').show();		
	}	
	else if ($('#company_adresse').val().length < 5) {
		$('.error-message').find('.error-message-txt').text('Veuillez indiquer une adresse valide');
	   	$('.error-message').show();				
	}				
	else if ($('#company_cp').val().length < 5 || $('#company_cp').val().length > 7) {
		$('.error-message').find('.error-message-txt').text('Veuillez indiquer un code postal valide');
	   	$('.error-message').show();				
	}	
	else if ($('#company_city').val().length < 3) {
		$('.error-message').find('.error-message-txt').text('Veuillez indiquer une ville');
	   	$('.error-message').show();				
	}			
	else if ($('#last_name').val().length < 3 ) {
		$('.error-message').find('.error-message-txt').text('Veuillez indiquer votre nom de famille');
	   	$('.error-message').show();				
	}		
	else if ($('#first_name').val().length < 3 ) {
		$('.error-message').find('.error-message-txt').text('Veuillez indiquer votre prénom');
	   	$('.error-message').show();				
	}	
	else if ($('#company_name').val().length < 3 ) {
		$('.error-message').find('.error-message-txt').text('Veuillez indiquer le nom de votre entreprise');
	   	$('.error-message').show();				
	}									
	else {		

		let id_user = $('#id_user').val();
		let token = $('#token').val();  

		let infos = {
			id_user: id_user,
			token: token,
			civil: civil,
			last_name: $('#last_name').val(),
			first_name: $('#first_name').val(),
			tel: $('#tel').val(),
			password: $('#password').val(),
			company_name: $('#company_name').val(),
			tva: $('#tva').val(),
			siret: $('#siret').val(),
			company_adresse: $('#company_adresse').val(),
			company_cp: $('#company_cp').val(),
			company_city: $('#company_city').val(),
		}
		
		$.ajax({
		   url : `/user-confirmation/${id_user}/${token}`,
		   type : 'POST',
		   data: infos,
		   dataType : 'json',
		   success : function(resultat, statut){
		   		$('.success-modal h3').text('Compte validé !');
		   		$('.btn-validate').text('Se connecter');
		   		$('.success-modal').show();	 
		   },

		   error : function(resultat, statut, erreur){
		   		alert(erreur);
		   		alert(resultat.JSONerror.message);
				$('.error-message').find('.error-message-txt').text(resultat.JSONerror.message);
	   			$('.error-message').show();	
		   },

		});	
	}
})