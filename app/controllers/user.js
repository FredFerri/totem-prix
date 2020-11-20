
// exports.createUser = async function(datas) {
// 	return new Promise(async function(resolve, reject) {	
// 		try {		
// 			encrypt.cryptPassword(datas['password'], async function(err, hash) {
// 				datas['password'] = hash;
// 				let userResponse = await User.create(datas);
// 				console.dir(userResponse);
// 				resolve(userResponse);
// 			});
// 		}
// 		catch(err) {
// 			reject(err);
// 		}
// 	})
// }

// exports.createUserLight = async function(datas) {
// 	return new Promise(async function(resolve, reject) {	
// 		let userResponse = await User.createLight(datas);
// 		console.dir(userResponse);
// 		if (userResponse.error == false) {
// 			console.log('step 1');
// 			let confirmationMessage = await exports.sendConfirmationMail(userResponse);
// 			resolve({message: confirmationMessage});
// 		}
// 		else {
// 			console.log('step 2');
// 			resolve(userResponse);
// 		}
// 	})
// }

exports.sendConfirmationMail = function(userDatas) {
	return new Promise(async function(resolve, reject) {
		let confirmationUrl = `totem-prix.com:8080/user-activation/${userDatas.id}/${userDatas.activation_token}/`;
		console.log(`CONFIRMATION URL = ${confirmationUrl}`);
		resolve(confirmationUrl);
	})
}

// exports.updateUser = async function(datas) {
// 	return new Promise(async function(resolve, reject) {	
// 		let userResponse = await User.update(datas);
// 		console.dir(userResponse);
// 		resolve(userResponse);
// 	})
// }

// exports.getUser = function(id) {
// 	return new Promise(async function(resolve, reject) {	
// 		let userResponse = await User.getById(id);
// 		resolve(userResponse);
// 	})
// }

// exports.deleteUser = function(id) {
// 	return new Promise(async function(resolve, reject) {
// 		let userResponse = await User.delete(id);
// 		resolve(userResponse); 
// 	})
// }

// exports.activateUser = async function(id, token) {
// 	return new Promise(async function(resolve, reject) {	
// 		let userResponse = await User.checkActivationToken(id, token);
// 		console.dir(userResponse);
// 		if (userResponse === true) {
// 			console.log('ACTIVATE');
// 			let activationResponse = await User.activate(id);
// 			console.dir(activationResponse);
// 			resolve(activationResponse);
// 		}
// 		else {
// 			reject(false);
// 		}
// 	})
// }

// exports.confirmUser = function(datas) {
// 	return new Promise(function(resolve, reject) {	
// 		let confirmationResult = User.confirm(datas);
// 		resolve(confirmationResult);
// 	})
// }

// exports.loginUser = function(datas) {
// 	return new Promise(async function(resolve, reject) {	
// 		let userResponse = User.login(datas);
// 		resolve(userResponse);
// 	})
// }

// exports.resetPasswordVerif = function(email) {
// 	return new Promise(async function(resolve, reject) {
// 		let response = {};	
// 		let verifResponse = await User.emailVerification(email);
// 		if (verifResponse === true) {
// 			let mailResponse = await exports.sendResetPasswordEmail(verifResponse);
// 			response.message = mailResponse;
// 			response.error = false;
// 			resolve(response);
// 		}
// 		else {
// 			response.error = true;
// 			response.message = 'Adresse mail inconnue'
// 			resolve(response);
// 		}
// 	})
// }

exports.sendResetPasswordEmail = function(datas) {
	return new Promise(async function(resolve, reject) {	
		console.log('RESET PASSWORD MAIL SENT TO '+datas.email);
		console.log(`REINIT URL = argos-dev.com:8080/password-reset/${datas.id}/${datas.reset_password_token}`)
		resolve(true);
	})
}

// exports.checkResetToken = function(reset_token) {
// 	return new Promise(async function(resolve, reject) {	
// 		let checkResponse = User.checkResetToken(reset_token);
// 		return checkResponse;
// 	})
// }

// exports.resetPassword = function(datas) {
// 	return new Promise(async function(resolve, reject) {	
// 		let resetResponse = User.resetPassword(datas);
// 		return resetResponse;
// 	})
// }