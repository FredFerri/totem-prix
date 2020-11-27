$('document').ready(function() {
	if ($('#user-payment-method').val() == 'cb') {
		$('#option_cb').click();
	}
	else if ($('#user-payment-method').val() == 'sepa') {
		$('#option_sepa').click()
	}
})

$('nav a.group').removeClass('text-white');
$('nav a.group').removeClass('bg-gray-900');
$('nav a.group').addClass('text-gray-300');
$('.menu-profile').addClass('text-white');
$('.menu-profile').removeClass('text-gray-300');
$('.menu-profile').addClass('bg-gray-900');

$('.btn-profil-edit').on('click', function(e) {
	e.preventDefault();
	let id = $(this).attr('id');
	let editBlockName = id.replace('btn-', '');
	let originalBlockName = editBlockName.replace('edit-', '');
	e.preventDefault();	
	$('#'+originalBlockName).hide();
	e.preventDefault();
	$('#'+editBlockName).show();
	e.preventDefault();

})

$('.edit-profil-block .btn-cancel').on('click', function() {
	$('.edit-profil-block').hide();
	let id_edit_block = $(this).attr('id');
	let id_original_block = id_edit_block.replace('edit-', '').replace('_cancel', '');
	$('#'+id_original_block).show();
})	

var user_id = $('#user-id').val();

$('#profil-edit-infos_submit').on('click', function(e) {
	e.preventDefault();
	displayLoader();
	let civil = $('.civil_radio:checked').val();
	let first_name = $('#first_name').val();
	let last_name = $('#last_name').val();
	let tel = $('#tel').val();

	if (civil == '' || !civil) {
		hideLoader();
		loadError('Vérifiez que toutes les informations soient remplies correctement');
		return false;			
	}

	if (first_name.length < 2 || last_name.length < 2 || tel.length < 10 || tel.length > 14) {
		hideLoader();
		loadError('Vérifiez que toutes les informations soient remplies correctement');
		return false;
	}

	let datas = {
		mode: 'infos',
		civil: civil,
		first_name: $('#first_name').val(),
		last_name: $('#last_name').val(),
		tel: $('#tel').val()
	};

	$.ajax({
	   url : `/user-manage/${user_id}/`,
	   type : 'PUT',
	   data: datas,
	   dataType : 'json',
	   success : function(resultat, statut){
	   		hideLoader();
	   		console.dir(resultat);
	   		loadModal();
	   },
	   error : function(resultat, statut, erreur) {
	   		hideLoader();
		   	loadError(resultat.responseJSON.message);
		   	return false;   	
	   }
	})
})

$('#profil-edit-password_submit').on('click', function(e) {
	e.preventDefault();
	displayLoader();
	let password = $('#password').val();
	let password_confirm = $('#password_confirm').val();
	if (password != password_confirm) {
		hideLoader();
		loadError('Les deux mots de passe ne correspondent pas');
		return false;
	}
	if (password.length < 6) {
		hideLoader();
		loadError('Votre mot de passe doit contenir au moins 6 caractères');
		return false;
	}
	else {	
		$.ajax({
		   url : `/user-manage/${user_id}/`,
		   type : 'PUT',
		   data: {mode: 'password', password: password},
		   dataType : 'json',
		   success : function(resultat, statut){
		   		hideLoader();
		   		console.dir(resultat);
		    	loadModal();
		   },
		   error : function(resultat, statut, erreur) {
		   		hideLoader();
		   		loadError(resultat.responseJSON.message);
		   		return false;
		   }
		})		
	}
})

$('#profil-edit-company_submit').on('click', function(e) {
	e.preventDefault();
	displayLoader();
	if ($('#tva').val().length > 0 && $('#tva').val().length < 11) {
		$('.error-message').find('.error-message-txt').text('Numéro de TVA non valide');
	   	$('.error-message').show();				
	}
	else if ($('#siret').val().length< 14) {
		hideLoader();
		loadError('Numéro SIRET non valide');
		return false;				
	}		
	else if ($('#company_cp').val().length < 5 || $('#company_cp').val().length > 7) {
		hideLoader();
		loadError('Veuillez indiquer un code postal valide');
		return false;				
	}	
	else if ($('#company_name').val().length < 2) {
		hideLoader();
		loadError("Veuillez indiquer un nom d'entreprise");
		return false;				
	}	
	else if ($('#company_city').val().length < 2) {
		hideLoader();
		loadError("Veuillez indiquer une ville");
		return false;				
	}							

	else {	
		let datas = {
			mode: 'company',
			company_name: $('#company_name').val(),
			tva_num: $('#tva').val(),
			siret: $('#siret').val(),
			company_adresse: $('#company_adresse').val(),
			company_cp: $('#company_cp').val(),
			company_city: $('#company_city').val()
		};

		$.ajax({
		   url : `/user-manage/${user_id}/`,
		   type : 'PUT',
		   data: datas,
		   dataType : 'json',
		   success : function(resultat, statut){
		   		hideLoader();
		   		console.dir(resultat);
		    	loadModal();
		   },
		   error : function(resultat, statut, erreur) {
		   		hideLoader();
	   			loadError(resultat.responseJSON.message);
	   			return false;
		   }
		})
	}

})

$('#profil-edit-payment_submit').on('click', function() {
	displayLoader();
	let payment_type;
	let infos_payment;
	let user_id = $('#user-id').val();
	let myCard = $('.card-js');

	if ($('#option_cb').is(':checked')) {
		payment_type = 'cb';
		let cardNumber = myCard.CardJs('cardNumber');
		let expiryMonth = myCard.CardJs('expiryMonth');
		let expiryYear = myCard.CardJs('expiryYear');
		let cvc = myCard.CardJs('cvc');

		infos_payment = {
			cardNumber: cardNumber,
			expiryMonth: expiryMonth,
			expiryYear: expiryYear,
			cvc: cvc
		};

		console.dir(infos_payment);
	}
	else if ($('#option_sepa').is(':checked')) {
		payment_type = 'sepa';
		let iban = $('#iban').val();
		infos_payment = {
			iban: iban
		};
	}
	else {
		return false;
	}

	$.ajax({
	   url : `/payment/${user_id}/`,
	   type : 'PUT',
	   data: {infos_payment: infos_payment, payment_type: payment_type},
	   dataType : 'json',
	   success : function(resultat, statut){
	   		hideLoader();
	   		console.dir(resultat);
	    	loadModal();
	   },
	   error : function(resultat, statut, erreur) {
	   		hideLoader();
	   		loadError(resultat.responseJSON.message);
	   		return false;
	   }
	})	
})


$('.option_payment').on('change', function() {
	if ($('#option_sepa').is(':checked')) {
		$('.sepa-block').show();
		$('.cb-block').hide();
	}
	else if ($('#option_cb').is(':checked')) {
		$('.cb-block').show();
		$('.sepa-block').hide();
	}		
})

document.getElementById('iban').addEventListener('input', function (e) {
  e.target.value = e.target.value.replace(/[^\dA-Z]/g, '').replace(/(.{4})/g, '$1 ').trim();
});	

$('#profil-edit-payment-cb_submit').on('click', function() {
	displayLoader();
	let cardInfos = $('.card-js');
	let cardMonth = cardInfos.CardJs('expiryMonth');
	if (cardMonth.length == 1) {
		cardMonth = '0'+cardMonth;
	}
	let datas = {	
		cardNumber: cardInfos.CardJs('cardNumber'),
		expiryMonth: cardMonth,
		expiryYear: cardInfos.CardJs('expiryYear'),
		cvc: cardInfos.CardJs('cvc'),
		userLastName: $('#last_name').val(),
		userFirstName: $('#first_name').val(),
		userEmail: $('#email').val(),
		companyTva: $('#tva').val(),
		companySiret: $('#siret').val(),
		companyAdresse: $('#company_adresse').val(),
		companyCity: $('#company_city').val(),
		companyCp: $('#company_cp').val(),
		companyName: $('#company_name').val(),
		userId: $('#user-id').val()
	};

	console.dir(datas);

	if (datas.cardNumber.length < 16 || datas.expiryMonth.length < 1 || datas.expiryYear.length < 2 || datas.cvc.length < 3) {
		hideLoader();
	   	loadError("Informations de paiement invalides");	
			return false;	
	}


	$.ajax({
	   url : `/user-add-cb/${user_id}/`,
	   type : 'POST',
	   data: datas,
	   dataType : 'json',
	   success : function(resultat, statut){
	   		hideLoader();
	   		loadModal();
	   },
	   error : function(resultat, statut, erreur) {
	   		hideLoader();
	   		console.dir(resultat);
	   		loadError(resultat.responseJSON.message);
	   		return false;
	   }
	})			
})


$('#profil-edit-payment-sepa_submit').on('click', function() {
	displayLoader();
	let datas = {	
		iban: $('#iban').val(),
		userEmail: $('#email').val(),
		userLastName: $('#last_name').val(),
		userFirstName: $('#first_name').val(),
		companyTva: $('#tva').val(),
		companySiret: $('#siret').val(),
		companyAdresse: $('#company_adresse').val(),
		companyCity: $('#company_city').val(),
		companyCp: $('#company_cp').val(),
		companyName: $('#company_name').val(),
		userPhone: $('#tel').val()
	};

	if (datas.iban.length < 27) {
		hideLoader();
	   	loadError('Veuillez indiquer un IBAN valide');
			return false;	
	}

	$.ajax({
	   url : `/user-add-sepa/${user_id}/`,
	   type : 'POST',
	   data: datas,
	   dataType : 'json',
	   success : function(resultat, statut){
	   		hideLoader();
	   		loadModal();
	   },
	   error : function(resultat, statut, erreur) {
	   		hideLoader();
	   		console.dir(resultat);
		   	loadError(resultat.responseJSON.message);
			return false;	
	   }
	})			
})	
