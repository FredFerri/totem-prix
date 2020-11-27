function loadError(message) {
	$('.error-message').find('.error-message-txt').text(message);
	$('.error-message').show();		
}	

$('.error-message-close').on('click', function() {
	$(this).parent().parent().parent().parent().parent('.error-message').hide();
})	

function goToMyAccount() {
	let user_id = $('.user-id').val();
	document.location.href = '/profil/'+user_id;
}

function goToDashboard() {
	window.location.href = '/';
}

function reload() {
	document.location.reload();
}

function loadModal() {
	$('.success-modal #modal-headline').text('Modification validée !')
	$('.success-modal .btn-validate').attr('onclick', 'reload()');
	$('.success-modal .btn-validate').text('OK');
	$('.success-modal').show();	
}

function closeModal(e) {
	e.preventDefault();
	$('.modal').hide();
}

function displayLoader() {
	$('body').css(
		{
			'opacity': '0.4',
			'background-color': '#000'
		}
	);
}

function hideLoader() {
	$('body').css(
		{
			'opacity': '1',
			'background-color': '#fff'
		}
	);
}	

$('.error-message-close').on('click', function() {
	$(this).parent().parent().parent().parent().parent('.error-message').hide();
})	

$('.success-message-close').on('click', function() {
	$(this).parent().parent().parent().parent().parent('.success-message').hide();
})	