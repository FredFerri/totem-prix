$('#form-login-user').on('submit', function(e) {
	e.preventDefault();
	let datas = {
		email: $('#login_email').val(),
		password: $('#login_password').val()
	};

	$.ajax({
	   url : '/user-login/',
	   type : 'POST',
	   data: datas,
	   dataType : 'json',
	   success : function(resultat, statut){
	   		if (resultat.error === false) {
	       		document.location.href = '/';
	   		}
	   		else {
	   			$('.error-message-txt').text(resultat.message);
	   			$('.error-message').show();	
	   		}
	   },
	   error : function(resultat, statut, erreur){
	   		console.dir(resultat);
	   		$('.error-message-txt').text(resultat.responseJSON.message);
	    	$('.error-message').show();	
	   }

	});			
})

$('.error-message-close').on('click', function() {
	$(this).parent().parent().parent().parent().parent('.error-message').hide();
})