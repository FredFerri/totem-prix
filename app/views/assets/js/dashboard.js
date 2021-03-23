$('.btn-add-station').on('click', function(e) {
	e.preventDefault();
	if ($('.add-station-block').is(':hidden')) {
		$('.add-station-block').show();
	}
})

$('.btn-edit-station').on('click', function(e) {
	e.preventDefault();
	let id_station = $(this).attr('id');
	id_station = id_station.replace('btn-edit-station_', '');
	if ($('#edit-station-card_'+id_station).is(':hidden')) {
		$('#edit-station-card_'+id_station).show();
		$('#edit-station-card_'+id_station).css('grid-row', 'span 2');
		$('#station-card_'+id_station).hide();
	}
})

$('.cancel-edit-station .btn-cancel').on('click', function(e) {
	e.preventDefault();
	let id_station = $(this).attr('id');
	id_station = id_station.replace('btn-cancel_', '');		
	$('#edit-station-card_'+id_station).hide();
	$('#station-card_'+id_station).show();
	$('#edit-station-card_'+id_station).css('grid-row', '');
})

$('.cancel-add-station').on('click', function(e) {
	e.preventDefault();
	$('.add-station-block').hide();
})

$('.edit-oil-type').one('click', function(e) {
	$('.oilList-has-been-edited').val('ok');
})


$('#btn-submit-add-station').on('click', function(e) {
	e.preventDefault();
	$('.form-add-station').submit();		
})

$('.form-add-station').on('submit', function(e) {
	e.preventDefault();	
	let station_name = $('#add-station-name').val();
	let station_street = $('#add-station-street').val();
	let station_cp = $('#add-station-cp').val();
	let station_city = $('#add-station-city').val();
	let mosaic_username = $('#add-mosaic-username').val();
	let mosaic_password = $('#add-mosaic-password').val();
	let roulezeco_username = $('#add-roulezeco-username').val();
	let roulezeco_password = $('#add-roulezeco-password').val();
	let scraping_time = $('#add-scraping-time').val();
	scraping_time = scraping_time+':00';
					

	let datas = {
		station_name: station_name,
		station_street: station_street,
		station_cp: station_cp,
		station_city: station_city,
		mosaic_username: mosaic_username,
		mosaic_password: mosaic_password,
		roulezeco_username: roulezeco_username,
		roulezeco_password: roulezeco_password,
		scraping_time: scraping_time
	};

	let verification = checkFormDatas(datas);	

	if (verification !== false) {	
		displayLoader();
		$.ajax({
		   url : '/station-manage/',
		   type : 'POST',
		   data: datas,
		   dataType : 'json',
		   success : function(resultat, statut){
		   		console.dir(resultat);
		   		let id_station = resultat.datas.id_station;
		   		let id_user = resultat.datas.id_user;
		   		let station_name = resultat.datas.station_name;
		   		let id_automation = resultat.datas.id_automation;
		   		hideLoader();
		   		$('.success-modal h3').text('Nouvelle station créée !');
		   		$('.success-modal .btn-validate').text('Ok');
		   		$('.success-modal .btn-validate').attr('onclick', `synchronizeAccount(${id_station}, ${id_user}, '${station_name}', ${id_automation})`);
		   		$('.success-modal').show();	
		   },
		   error : function(resultat, statut, erreur){
		   		hideLoader();
		   		loadError(resultat.responseJSON.message);
		   		return false;
		   }
		})	
	}	

})

function synchronizeAccount(id_station, id_user, station_name, id_automation) {
	$('.success-modal').hide();	
	$('.success-modal h3').text('Synchronisation de vos données carburants avec https://gestion.roulez-eco.fr/ (Cela peut prendre 1 à 2 minutes...)');
	$('.success-modal .btn-validate').text('Veuillez patienter...');
	$('.success-modal .btn-validate').attr('onclick', null);
	$('.success-modal').show();	
	// displayLoader();

	$.ajax({
		   url : '/automatic-test-credentials/'+id_automation,
		   type : 'GET',
		   dataType : 'json',
		   success : function(resultat, statut){
		   		console.log('test credentials success');
		   		firstUpdateOilList(id_station, id_user, station_name, id_automation);
		   },
		   error : function(resultat, statut, erreur) {
		   		$('.disrupts-modal').hide();
		   		loadError(resultat.responseJSON.message);
		   		deleteStation(id_station, id_automation);
		   		sendErrorMail(id_user);
		   		//setTimeout(function() {
		   		//	document.location.reload();
		   		//}, 3000)
		   }
		})		
}

function firstUpdateOilList(id_station, id_user, station_name, id_automation) {

	$.ajax({
		   url : '/update-oil-list/',
		   type : 'POST',
		   data: {
		   	id_station: id_station
		   },
		   dataType : 'json',
		   success : function(resultat, statut){
		   		console.log('firstUpdateOilList success');
		   		automaticActivateStation(id_station, id_user, station_name);
		   },
		   error : function(resultat, statut, erreur) {
		   		$('.disrupts-modal').hide();
		   		loadError(resultat.responseJSON.message);
		   		deleteStation(id_station, id_automation);
		   		sendErrorMail(id_user);
		   		//setTimeout(function() {
		   		//	document.location.reload();
		   		//}, 3000)
		   }
		})			
}

function sendErrorMail(id_user) {
	$.ajax({
	   url : '/station-manage-error/',
	   type : 'POST',
	   data: {
	   	id_user: id_user
	   },
	   dataType : 'json',
	   success : function(resultat, statut){
	   		console.log('sendErrorMail OK');
	   },
	   error : function(resultat, statut, erreur) {
	   		console.log(erreur);
	   }
	})
}

function deleteStation(id_station, id_automation) {
	$.ajax({
		   url : '/station/'+id_station,
		   type : 'DELETE',
		   data: {
		   	automation_id: id_automation
		   },
		   dataType : 'json',
		   success : function(resultat, statut){
		   		console.log('deleteStation success');
		   		hideLoader();
		   		$('.success-modal').hide();	
		   		loadError(`Veuillez vérifier que les identifiants que vous avez indiqué sont bien valides. 
		   			Si vos identifiants sont corrects, veuillez réessayer votre création de station ultérieurement, 
		   			le problème peut venir d'un bug temporaire de la plateforme roulez-eco`);
		   },
		   error : function(resultat, statut, erreur) {
		   		console.log(erreur);
		   }
		})		
}

function automaticActivateStation(id_station, id_user, station_name) {
		$.ajax({
		   url : '/station-activate/',
		   type : 'POST',
		   data: {
		   	id_station: id_station,
		   	id_user: id_user,
		   	station_name: station_name
		   },
		   dataType : 'json',
		   success : function(resultat, statut){
		   	hideLoader();
		   	$('.confirm-modal').hide();
	   		$('.success-modal h3').text('Informations synchonisées !');
	   		$('.success-modal .btn-validate').text('Ok');
	   		$('.success-modal .btn-validate').attr('onclick', 'reload()');
	   		$('.success-modal').show();			   
		   },
		   error : function(resultat, statut, erreur) {
		   		loadError(resultat.responseJSON.message);
		   		return false;
		   }
		})	
}

$('.btn-submit-edit-station').on('click', function() {
	let id_station = $(this).attr('id').replace('btn-submit-edit-station_', '');
	$('#form-edit-station_'+id_station).submit();
})

$('.form-edit-station').on('submit', function(e) {
	e.preventDefault();	
	let id_station = $(this).attr('id');
	id_station = id_station.replace('form-edit-station_', '');
	let id_automation =  $('#station-card_'+id_station).find('.automation-id').val();
	id_automation = id_automation.replace('form-edit-station_', '');
	id_station = id_station.replace('form-edit-station_', '');
	let station_id = $('#station-id_'+id_station).val();		
	let station_name = $('#edit-station-name_'+id_station).val();
	let station_street = $('#edit-station-street_'+id_station).val();
	let station_cp = $('#edit-station-cp_'+id_station).val();
	let station_city = $('#edit-station-city_'+id_station).val();
	let mosaic_username = $('#edit-mosaic-username_'+id_station).val();
	let mosaic_password = $('#edit-mosaic-password_'+id_station).val();
	let roulezeco_username = $('#edit-roulezeco-username_'+id_station).val();
	let roulezeco_password = $('#edit-roulezeco-password_'+id_station).val();
	let scraping_time = $('#edit-scraping-time_'+id_station).val();
	scraping_time = scraping_time+':00';


	let datas = {
		station_name: station_name,
		station_street: station_street,
		station_cp: station_cp,
		station_city: station_city,
		mosaic_username: mosaic_username,
		mosaic_password: mosaic_password,
		roulezeco_username: roulezeco_username,
		roulezeco_password: roulezeco_password,
		scraping_time: scraping_time
	};

	let verification = checkFormDatas(datas);

	if (verification !== false) {	
		displayLoader();
		$.ajax({
		   url : '/station-manage/'+id_station+'/'+id_automation,
		   type : 'PUT',
		   data: datas,
		   dataType : 'json',
		   success : function(resultat, statut){
		   		console.dir(resultat);
		   		hideLoader();
		   		$('.success-modal h3').text('Informations mises à jour !');
		   		$('.success-modal .btn-validate').text('Ok');
		   		$('.success-modal .btn-validate').attr('onclick', 'reload()');
		   		$('.success-modal').show();	

		   },
		   error : function(resultat, statut, erreur){
		   		hideLoader();
		   		loadError(resultat.responseJSON.message);
		   		return false;
		   }
		})	
	}

})	

var id_station_focus;

$('.btn-add-disrupt').on('click', function(e) {
	e.preventDefault();
	displayLoader();
	let station_id = $(this).attr('id');
	station_id = station_id.replace('btn-add-disrupt_', '');
	id_station_focus = station_id;

	$.ajax({
	   url : '/station-oils/'+station_id,
	   type : 'GET',
	   dataType : 'json',
	   success : function(resultat, statut){
	   		console.dir(resultat);
	   		hideLoader();
	   		let html = `<div class="edit-disrupt" id="edit-disrupt_${station_id}"><form id="form-disrupt" onsubmit="editDisrupt(event, $(this))">`;
	   		if (resultat.length == 0) {
	   			html += '<div class="block"><p>Pas de carburant enregistré pour le moment. Appuyez sur le bouton "Mettre à jour ma liste de carburants" pour récupérer la liste enregistrée sur https://gestion.roulez-eco.fr/</p></div>';
	   		}
	   		else {	   		
		   		for (let i=0; i<resultat.length; i++) {
		   			if (resultat[i].disrupt === true) {
		   				let last_disrupt_date = '';
		   				if (resultat[i].last_disrupt_date) {
		   					last_disrupt_date = 'Déclaré en rupture le '+resultat[i].last_disrupt_date;
						}
		   				html += `
		   				<div class="block">
						<span role="checkbox" tabindex="0" aria-checked="true" id="toggle-disrupt_${resultat[i].id}" class="toggle-disrupt bg-red-400 relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:shadow-outline">
						  <!-- On: "translate-x-5", Off: "translate-x-0" -->
						  <span aria-hidden="true" class="toggle-btn translate-x-5 inline-block h-5 w-5 rounded-full bg-white shadow transform transition ease-in-out duration-200"></span>
						</span>

		   				<label for="oil-${resultat[i].id}">${resultat[i].name}</label>
		   				<span class="oil-edit-info">
		   					${last_disrupt_date}
		   				</span>
		   				</div>`;
		   			}
		   			else {

		   				html += `
		   				<div class="block">
						<span role="checkbox" tabindex="0" aria-checked="false" id="toggle-disrupt_${resultat[i].id}" class="toggle-disrupt bg-gray-200 relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:shadow-outline">	
						  <!-- On: "translate-x-5", Off: "translate-x-0" -->
						  <span aria-hidden="true" class="toggle-btn translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform transition ease-in-out duration-200"></span>
						</span>								
		   				<label for="oil-${resultat[i].id}">${resultat[i].name}</label>
		   				</div>`;
		   			}
		   		}
	   		}
	   		$('.disrupts-modal .modal-text-infos').html(html);
	   		$('.disrupts-modal').show();
	   },
	   	error : function(resultat, statut, erreur){
	   		hideLoader();
	   		loadError(resultat.responseJSON.message);
	   		return false;
	   }
	})			
})

function editDisrupt(event, elt) {
	event.preventDefault();
	displayLoader();
	$(elt).hide();
	$(elt).next('.btn-loading').css('display', 'flex');
	//let station_id = $(elt).parent().attr('id');
	//station_id = station_id.replace('edit-disrupt_', '');
	let datas = {};
	datas['station_id'] = id_station_focus;
	$('.toggle-disrupt').each(function() {
		let oilId = $(this).attr('id').replace('toggle-disrupt_', '');
		let oilValue = false;
		if ($(this).attr('aria-checked') == 'true') {
			oilValue = true;
		}
		datas[oilId] = oilValue; 
	})

	console.dir(datas);


	$.ajax({
	   url : '/disrupts/',
	   type : 'POST',
	   data: datas,
	   dataType : 'json',
	   success : function(resultat, statut){
	   		hideLoader();
	   		console.dir(resultat);
	    	$('.disrupts-modal').hide();
	    	document.location.reload();
	   },
	   error : function(resultat, statut, erreur) {
	   		hideLoader();
	   		$('.disrupts-modal').hide();
	   		loadError(resultat.responseJSON.message);
	   }
	})
}



$('.email-alert-block_top .btn-edit').on('click', function() {
	$(this).hide();
	$('span.email-alert-input_email').hide();
	$('.email-alert-block-edit').show();
})

$('.cancel-edit-station').on('click', function(e) {
	e.preventDefault();
	$('.email-alert-block-edit').hide();
	$('span.email-alert-input_email').show();
	$('.email-alert-block_top .btn-edit').show();
})

$('.email-alert-block-edit > form').on('submit', function(e) {
	e.preventDefault();
	let user_id = $('.user-id').val();
	let new_email = $('input.email-alert-input_email').val();
	$.ajax({
	   url : '/user-manage/'+user_id,
	   type : 'PUT',
	   data: {mode: 'email-alert', new_email: new_email},
	   dataType : 'json',
	   success : function(resultat, statut){
	   		console.dir(resultat);
	   		$('.success-modal h3').text('Informations mises à jour !');
	   		$('.success-modal .btn-validate').text('Ok');
	   		$('.success-modal .btn-validate').attr('onclick', 'reload()');
	   		$('.success-modal').show();	
	   },
	   error : function(resultat, statut, erreur) {
	   		loadError(resultat.responseJSON.message);
	   		return false;
	   }
	})		
})

$('#alert-email').on('click', function() {
	let user_id = $('.user-id').val();	
	let email_alert = false;
	if ($(this).is(':checked')) {
		email_alert = true;
	}
	$.ajax({
	   url : '/user-manage/'+user_id,
	   type : 'PUT',
	   data: {mode: 'email-alert-enabled', email_alert: email_alert},
	   dataType : 'json',
	   success : function(resultat, statut){
	   		console.dir(resultat);
	    	$('.email-alert-block-edit .btn-cancel').click();
	   },
	   error : function(resultat, statut, erreur) {
	   		loadError(resultat.responseJSON.message);
	   		return false;
	   }
	})	
})


$('.test-credentials').on('click', function(e) {
	e.preventDefault();
	let automation_id = $(this).attr('id').replace('test-credentials_', '');
	$(this).hide();
	$(this).next('.btn-loading').css('display', 'flex');		
	$.ajax({
	   url : '/test-credentials/'+automation_id,
	   type : 'GET',
	   data: {},
	   dataType : 'json',
	   success : function(resultat, statut){
	   		console.dir(resultat);
	   		let mosaicResultHtml;
	   		let roulezecoResultHtml;
	   		if (resultat.mosaicTest.error === true) {
	   			mosaicResultHtml = '<li>Mosaïc: <span class="text-red-600">Echec</span></li>';
	   		}
	   		else {
	   			mosaicResultHtml = '<li>Mosaïc: <span class="text-green-400">Succès !</span></li>';
	   		}
	   		if (resultat.roulezecoTest.error === true) {
	   			roulezecoResultHtml = '<li>Roulez-eco: <span class="text-red-600">Echec</span></li>';
	   		}
	   		else {
	   			roulezecoResultHtml = '<li>Roulez-eco: <span class="text-green-400">Succès !</span></li>';
	   		}		   	
	   		$('.success-modal h3').text('Résultat du test');
	   		$('.success-modal .modal-text-infos').html(`<ul>${mosaicResultHtml}${roulezecoResultHtml}`);
	   		$('.success-modal .btn-validate').text('Ok');
	   		$('.success-modal .btn-validate').attr('onclick', 'reload()');
	   		$('.success-modal').show();	
	    	$('.btn-loading').hide();
	    	$('.test-credentials').show();		   		
	   },
	   error : function(resultat, statut, erreur) {
	   		loadError(resultat.responseJSON.message);
	   		setTimeout(function() {
	   			window.location.reload();
	   		}, 4000);
	   		return false;
	   }
	})		
})

$(document).on('click','.toggle-disrupt',function(){
	if ($(this).attr('aria-checked') == 'true') {
		$(this).attr('aria-checked', 'false');
		$(this).removeClass('bg-red-400');
		$(this).addClass('bg-gray-200');			
		$(this).find('.toggle-btn').removeClass('translate-x-5');
		$(this).find('.toggle-btn').addClass('translate-x-0');
	}
	else {
		$(this).attr('aria-checked', 'true');
		$(this).removeClass('bg-gray-200');
		$(this).addClass('bg-red-400');			
		$(this).find('.toggle-btn').removeClass('translate-x-0');
		$(this).find('.toggle-btn').addClass('translate-x-5');
	}
})


function removeStation(station_id, subscription_id, automation_id) {
	if ($('#input-rmstation_'+station_id).val() == 'supprimer') {	
		$.ajax({
		   url : '/station/'+station_id,
		   type : 'DELETE',
		   data: {
		   	subscription_id: subscription_id,
		   	automation_id: automation_id
		   	},
		   dataType : 'json',
		   success : function(resultat, statut){
		   		$('.confirm-modal').hide();
		   		$('.success-modal h3').text('Suppression');
		   		$('.success-modal .modal-text-infos').html(`<p>Station supprimée !</p>`);
		   		$('.success-modal .btn-validate').text('Ok');
		   		$('.success-modal .btn-validate').attr('onclick', 'reload()');
		   		$('.success-modal').show();	
		   },
		   error : function(resultat, statut, erreur) {
		   		loadError(resultat.responseJSON.message);
		   		return false;
		   }
		})			
	}
	else {
		return false;
	}
}

// CODE POUR LA VERSION PAYANTE

// $('.btn-remove-station').on('click', function() {
// 	let station_id = $(this).attr('id').replace('btn-remove-station_', '');
// 	let subscription_id = $('#station-card_'+station_id).attr('data-subscription');
// 	let automation_id = $(this).parents('.btns-row').prev().find('.automation-id').val();
// 	let station_name = $('#station-card_'+station_id).find('h3').text();
// 		$('.confirm-modal h3').text('Suppression');
// 		$('.confirm-modal .modal-text-infos').html(`<p>Êtes-vous certain de vouloir supprimer la station "${station_name}" ? 
// 			(L'abonnement en cours pour cette station sera résilié et la station sera supprimée de façon définitive)</p>
// 			<p class="text-sm text-red-600 my-2">Pour confirmer la suppression, veuillez écrire "supprimer" ci dessous, puis cliquer sur "Oui"</p>
// 			<input id="input-rmstation_${station_id}" class="mt-1 form-input block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none 
// 			focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5" type="text"/>`);
// 		$('.confirm-modal .btn-validate').attr('onclick', `removeStation(${station_id}, '${subscription_id}', '${automation_id}')`);
// 		$('.confirm-modal').show();			
// })

$('.btn-remove-station').on('click', function() {
	let station_id = $(this).attr('id').replace('btn-remove-station_', '');
	let subscription_id = $('#station-card_'+station_id).attr('data-subscription');
	let automation_id = $(this).parents('.btns-row').prev().find('.automation-id').val();
	let station_name = $('#station-card_'+station_id).find('h3').text();
		$('.confirm-modal h3').text('Suppression');
		$('.confirm-modal .modal-text-infos').html(`<p>Êtes-vous certain de vouloir supprimer la station "${station_name}" ? 
			(Cette suppression est définitive)</p>
			<p class="text-sm text-red-600 my-2">Pour confirmer la suppression, veuillez écrire <strong>"supprimer"</strong> ci dessous, puis cliquer sur <strong>"Oui"</strong></p>
			<input id="input-rmstation_${station_id}" class="mt-1 form-input block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none 
			focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5" type="text"/>`);
		$('.confirm-modal .btn-validate').attr('onclick', `removeStation(${station_id}, '${subscription_id}', '${automation_id}')`);
		$('.confirm-modal').show();			
})			

function checkFormDatas(datas) {
	if (datas.station_name == '') {
		loadError("Vous devez renseigner un nom de station");
   		return false;		
	}
	if (datas.company_name == '') {
		loadError("Vous devez renseigner un nom de société");
   		return false;		
	}		
	if (datas.station_street == '' || datas.station_street.length < 5) {
		loadError("Vous devez renseigner une adresse valide");
   		return false;		
	}	
	if (datas.station_city == '') {
		loadError("Vous devez renseigner une ville");
   		return false;		
	}	
	if (datas.station_cp.length < 5 || datas.station_cp.length > 7) {
		loadError("Vous devez renseigner un code postal valide");
   		return false;		
	}
	if (datas.mosaic_username.length < 2) {
		loadError("Vous devez renseigner un nom d'utilisateur Mosaïc");
   		return false;		
	}	
	if (datas.roulezeco_username.length < 2) {
		loadError("Vous devez renseigner un nom d'utilisateur Roulez-eco");
   		return false;		
	}		
	if (datas.mosaic_password.length < 3) {
		loadError("Vous devez renseigner un mot de passe Mosaïc");
   		return false;		
	}		
	if (datas.roulezeco_password.length < 3) {
		loadError("Vous devez renseigner un mot de passe Roulez-eco");
   		return false;		
	}	
	if (datas.scraping_time.length < 5) {
		loadError("Vous devez indiquer un horaire d'automatisation");
   		return false;			
	}				

}

// CODE POUR LA VERSION PAYANTE

// $('.btn-activate-station').on('click', function() {
// 	let payment_method = $('.user-payment-method').val();
// 	if (!payment_method) {
// 		$('.error-activate-modal').show();
// 	}
// 	else {
// 		let id_station = $(this).attr('id').replace('btn-activate-station_', '');
// 		let station_name = $('#station-card_'+id_station).find('h3').text();
//    		$('.confirm-modal h3').text('Souscription à un abonnement');
//    		$('.confirm-modal .modal-text-infos').html(`<p>En poursuivant, vous allez payer la somme de 300€ HT 
//    			afin de souscrire à l'abonnement d'un an au service totem-prix pour la station "${station_name}"
//    			<p>
//    			<p class="text-xs my-2">Pour en savoir plus sur nos tarifs et nos conditions d'abonnement, veuillez cliquez <a href="#">ici</a></p>
//    			<p class="text-sm text-red-600 my-2">Afin de confirmer votre souscription à cet abonnement, veuillez écrire "je confirme" ci-dessous</p>
//    			<input id="input-confirmsubscription_${id_station}" class="mt-1 form-input block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none 
// 			focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5" type="text"/>
//    			` );
//    		$('.confirm-modal .btn-validate').text('Confirmer');
//    		$('.confirm-modal .btn-validate').attr('onclick', `activateStation(${id_station})`);
//    		$('.confirm-modal').show();	
// 	}
// })

$('.btn-activate-station').on('click', function() {
	let id_station = $(this).attr('id').replace('btn-activate-station_', '');
	let station_name = $('#station-card_'+id_station).find('h3').text();
	$('.confirm-modal h3').text(`Activation d'une station`);
	$('.confirm-modal .modal-text-infos').html(`<p>En poursuivant, vous allez activer la mise à jour automatique de vos tarifs pour la station "${station_name}" sur Roulez-eco par l'intermédiaire de nos robots d'automatisation
		<p>
		<p class="text-xs my-2">Vous êtes sur la version de test de notre application, aucun paiement n'est nécessaire pour l'activation de ce service.</p>
		<p class="text-sm text-red-600 my-2">Afin de confirmer l'automatisation des prix pour cette station, veuillez écrire <strong>"je confirme"</strong> ci-dessous</p>
		<input id="input-confirmsubscription_${id_station}" class="mt-1 form-input block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none 
	focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5" type="text"/>
		` );
	$('.confirm-modal .btn-validate').text('Confirmer');
	$('.confirm-modal .btn-validate').attr('onclick', `activateStation(${id_station})`);
	$('.confirm-modal').show();		
});

function activateStation(id_station) {
	if ($('#input-confirmsubscription_'+id_station).val() == 'je confirme') {	
		displayLoader();
		let id_user = $('.user-id').val();
		let station_name = $('#edit-station-name_'+id_station).val();	

		$.ajax({
		   url : '/station-activate/',
		   type : 'POST',
		   data: {
		   	id_station: id_station,
		   	id_user: id_user,
		   	station_name: station_name
		   },
		   dataType : 'json',
		   success : function(resultat, statut){
		   	hideLoader();
		   	$('.confirm-modal').hide();
	   		$('.success-modal h3').text(resultat.message);
	   		$('.success-modal .btn-validate').text('Ok');
	   		$('.success-modal .btn-validate').attr('onclick', 'reload()');
	   		$('.success-modal').show();			   
		   },
		   error : function(resultat, statut, erreur) {
		   		loadError(resultat.responseJSON.message);
		   		return false;
		   }
		})	
	}
	else {
		return false;
	}
}


function updateOilList(event, elt) {
	let id_station = $(elt).parents('.btns-block').prev().find('.edit-disrupt').attr('id');
	id_station = id_station.replace('edit-disrupt_', '');
	event.preventDefault();
	$(elt).hide();
	$(elt).prev('.btn-loading').css('display', 'flex');		
	$.ajax({
	   url : '/update-oil-list/',
	   type : 'POST',
	   data: {
	   	id_station: id_station
	   },
	   dataType : 'json',
	   success : function(resultat, statut){
	   	document.location.reload();	   
	   },
	   error : function(resultat, statut, erreur) {
	   		$('.disrupts-modal').hide();
	   		loadError(resultat.responseJSON.message);

	   		//setTimeout(function() {
	   		//	document.location.reload();
	   		//}, 3000)
	   }
	})			
}