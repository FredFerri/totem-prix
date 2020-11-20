const jwt = require("jsonwebtoken");
const jwtKey = "my_secret_key";

exports.authentification = async function(idUser) {
	return new Promise(function(resolve, reject) {
		const token = jwt.sign({ idUser: idUser }, jwtKey, {
			algorithm: "HS256",
			expiresIn: '1h',
		});	
		console.dir(token);
		resolve(token);	
	})
}

exports.tokenVerification = async function(token) {
	return new Promise(function(resolve, reject) {
		let payload;
		try {
			payload = jwt.verify(token, jwtKey);
			resolve(payload);		
		}
		catch(e) {
			if (e instanceof jwt.JsonWebTokenError) {
				// if the error thrown is because the JWT is unauthorized, return a 401 error
				resolve(false);

			}
			else {
				console.log(e);
				reject(e);	
			}		
		}		
	})
}

exports.tokenDecode = async function(token) {
	return new Promise(function(resolve, reject) {
		let decodedToken = jwt.decode(token);
		console.dir(decodedToken);
		resolve(decodedToken);
	})
}