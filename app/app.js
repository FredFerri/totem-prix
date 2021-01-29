const paths = require('../paths');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var bodyParser = require('body-parser');
const path = require('path');
const cookierParser = require('cookie-parser');
const jwtManager = require(paths.path_app_controllers+'jwt');
const hour = 3600000;
const axios = require('axios');
const encrypt_nohash = require(paths.path_app_controllers+'encrypt-nohash');
const moment = require('moment');
const mailController = require(paths.path_app_controllers+'sendMail');
const User = require(paths.path_app_models+'user');
const Station = require(paths.path_app_models+'station');
const Automation = require(paths.path_app_models+'automation');
const Oil = require(paths.path_app_models+'oil');
const StationOil = require(paths.path_app_models+'station_oil');
const { check, oneOf, validationResult } = require('express-validator');
const validator = require('validator');
const writeLog = require(paths.path_app_controllers+'writeLog');
const writeLogSheets = require(paths.path_app_controllers+'writeLogsInSheets');
const STRIPE_API = require(paths.path_app_controllers+'stripe-functions.js');
const URL_ARGOS_SCRAPER = 'http://localhost:8181/';


// app.use(express.static(__dirname + '/views/assets'));
app.use(express.static(path.join(__dirname, '/views/assets')));
app.set('views', path.join(__dirname, '/views'))

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use(cookierParser());

app.get('/', async function(req, res) {
	let tokenCheck = await jwtManager.tokenVerification(req.cookies.argos_token);
	if (tokenCheck === false) {
		res.status(403).render('login.ejs', {});
	}
	else {		
		try {
			let id_user = tokenCheck.idUser;
			let userInfos = await User.getById(id_user);
			let stations = await Station.getByUserId(id_user);
			let oils = await Oil.getAll();
			let oneStationIsActive = false;
			for (let i=0; i<stations.length; i++) {
				let oilsStation = await StationOil.getByStationId(stations[i].id);
				stations[i]['oils'] = oilsStation;
				let oilsIds = [];
				for (oil of oilsStation) {
					oilsIds.push(oil['id_oil'])
				};
				stations[i]['oilsIds'] = oilsIds;
				let automation = await Automation.getByStationId(stations[i].id);
				automation['mosaic_password'] = encrypt_nohash.decrypt(JSON.parse(automation['mosaic_password']));
				automation['roulezeco_password'] = encrypt_nohash.decrypt(JSON.parse(automation['roulezeco_password']));
				stations[i]['automation'] = automation;
				let disruptTotal = await StationOil.getDisruptTotal(stations[i].id);
				stations[i]['disruptTotal'] = disruptTotal;
				if (stations[i].active === true) {
					oneStationIsActive = true;
				}
			}
			userInfos['stations'] = stations;
			userInfos['oneStationIsActive'] = oneStationIsActive;
			console.dir(userInfos);

	    	res.status(200).render('dashboard.ejs', {userInfos: userInfos, oils: oils});
		}
		catch(e) {
			console.log(e);
			res.status(500).send({message: e});
		}	
	}
})

app.get('/register', async function(req, res) {
	res.status(200).render('register.ejs', {});
})

// Récupération d'un user
app.get('/user-manage/:id', async function(req, res) {
	let tokenCheck = await jwtManager.tokenVerification(req.cookies.argos_token);
	if (tokenCheck === false) {	
		res.status(403).render('index.ejs', {});
	}
	else {		
		try {
			let userInfos = await User.getById(req.params.id);
			console.dir(userInfos);
			if (userInfos !== false) {
				res.status(200).json(userInfos);
			}
			else {
				res.status(404).json({message: 'Utilisateur introuvable'})	
			}		
		}
		catch(e) {
			console.log(e);
			res.status(500).send({message: e});
		}	
	}		
})

// Connexion d'un user
app.post('/user-login/', async function(req, res) {
	let idUser = await User.login(req.body);
	if (idUser !== false) {
		let token = await jwtManager.authentification(idUser);
		res.cookie("argos_token", token, { maxAge: hour });
		await writeLog('success', `CONNECTION SUCCEED FOR USER ${idUser}`);
		await writeLogSheets.launch(`CONNECTION SUCCEED FOR USER ${idUser}`, 'app');
		res.status(200).json({message: 'Authentification réussie !', error: false});
	}
	else {
		res.status(401).json({message: 'Adresse mail ou mot de passe erroné', error: true});
	}
})

// Page de réinitialisation du password (mot de passe oublié)
app.get('/password-reset-verif', function(req, res) {
	res.render('password-reset-verif.ejs', {});
})

// Réinitialisation mot de passe user (mot de passe oublié)
app.post('/password-reset-verif', [
		check('email').isEmail()
	],
async function(req, res) {
	let verifResponse = await User.emailVerification(req.body.email);
	console.dir(verifResponse);
	if (verifResponse === false) {
		res.status(401).json({message: "Adresse mail introuvable"});
	}
	else {
		let resetUrl = `app.totem-prix.com/password-reset/${verifResponse.id}/${verifResponse.reset_password_token}`;
		let mailResponse = await mailController.sendMailJet(req.body.email, verifResponse.first_name, 'reset-password', resetUrl);
		if (mailResponse === true) {
			await writeLog('success', `RESET PASSWORD MAIL SENT FOR USER ${verifResponse.id}`);
			res.status(200).json({message: "Demande acceptée ! Veuillez consulter votre boite mail et suivre les instructions."})
		}
		else {
			let errMessage = `SEND RESET PASSWORD MAIL - Problème rencontré: ${err} POUR USER ${verifResponse.id}`;
			await writeLog('error', errMessage);	
			await writeLogSheets.launch(errMessage, 'app');		
			res.status(500).json({message: "Problème lors de l'envoi du mail"});
		}
	}
})

app.get('/password-reset/:id_user/:password_reset_token', async function(req, res) {
	let checkResponse = await User.checkResetToken(req.params.password_reset_token);
	if (checkResponse !== false) {
		res.render('password-reset.ejs', {user_id: checkResponse.id})
	}
	else {
		res.render('page-error.ejs', {});
	}
})

app.post('/password-reset', [
	check('password').isLength({min: 6}),
	], async function(req, res) {
	const validationErrors = validationResult(req);
	if (!validationErrors.isEmpty()) {
		res.status(400).json({message: "Votre mot de passe doit contenir au moins 6 caractères"});
	}
	else {	
		let resetResponse = await User.resetPassword(req.body);
		if (resetResponse === true) {
			await writeLog('success', `RESET PASSWORD SUCCEED FOR USER ${req.body.id}`);
			await writeLogSheets.launch(`RESET PASSWORD SUCCEED FOR USER ${req.body.id}`, 'app');
			await User.clearResetToken(req.body.id);
			res.status(200).json({message:'Mot de passe modifié !'});
		}
		else {
			let errMessage = `RESET PASSWORD - Problème rencontré: ${err} POUR USER ${req.body.id}`;
			await writeLog('error', errMessage);	
			await writeLogSheets.launch(errMessage, 'app');
			res.status(500).json({message: "Problème lors de l'enregistrement"});
		}
	}
})

// création d'un user à partir d'une adresse mail
app.post('/user-manage', [	
	check('email').isEmail()
	], 
	async function(req, res) {		
		try {		
			const validationErrors = validationResult(req);
			if (!validationErrors.isEmpty()) {
				res.status(400).json({message: "Adresse mail non valide"});
			}
			else {
				let userResponse = await User.createLight(req.body);
				if (userResponse.codeError == 0) {
					await writeLog('success', `NEW USER CREATED, ID = ${userResponse.datas.id}`);
					await writeLogSheets.launch(`NEW USER CREATED, ID = ${userResponse.datas.id}`, 'app');
					let confirmationUrl = `app.totem-prix.com/user-activation/${userResponse.datas.id}/${userResponse.datas.activation_token}/`;
					await mailController.sendMailJet(req.body.email, userResponse.datas.first_name, 'inscription', confirmationUrl);
					res.status(200).json({message: `Compte créé ! Veuillez consulter votre boite mail afin de confirmer votre compte.`, confirmationUrl: confirmationUrl});
				}
				else if (userResponse.codeError == 1) {
					res.status(400).json({message: "Adresse mail déja enregistrée", confirmationUrl: null});
				}
				else {
					await writeLog('error', `CREATE USER - Problème rencontré: ${userResponse.error}`);
					res.status(500).json({message: "Problème lors de l'enregistrement", confirmationUrl: null});
				}
			}
		}
		catch(err) {
			console.log(err);
			await writeLog('error', `CREATE USER - Problème rencontré: ${err}`);
			await writeLogSheets.launch(`CREATE USER - Problème rencontré: ${err}`, 'app');
			res.status(500).send({message: err})
		}
	}
)

// activation d'un user à partir d'un lien envoyé par mail
app.get('/user-activation/:id_user/:token', async function(req, res) {
	let token = req.params.token;
	let idUser = req.params.id_user;
	try {	
		let result = await User.checkActivationToken(idUser, token);
		if (result === true) {
			let activationResponse = await User.activate(idUser);
			console.dir(activationResponse);
			if (activationResponse === true) {

				res.redirect('/user-confirmation/'+idUser+'/'+token);
			}
		}
	}
	catch(err) {		
		let errMessage = `ACTIVATE USER - Problème rencontré: ${err} POUR USER ${idUser}`;
		await writeLog('error', errMessage);	
		await writeLogSheets.launch(errMessage, 'app');
		res.sendStatus(500);
	}
})

app.get('/user-confirmation/:id_user/:token', async function(req, res) {
	let checkToken = await User.checkActivationToken(req.params.id_user, req.params.token);
	if (checkToken === true) {
		res.render('confirmation.ejs', {user_id: req.params.id_user, activation_token: req.params.token});
	}
	else {
		res.status(403).redirect('/');
	}
})

// finalisation de création d'un user (infos supplémentaires)
app.post('/user-confirmation/:id_user/:token', [
		check('civil').isLength({min: 6}),
		check('first_name').isLength({min: 2}).trim(),
		check('last_name').isLength({min: 2}).trim(),
		check('tel').isLength({min: 10, max: 14}),
		check('password').isLength({min: 6}),
		check('company_name').isLength({min: 2}).trim(),
		check('tva').optional({checkFalsy: true}).isLength({min: 11, max: 16}),
		check('siret').isNumeric().isLength({min: 13, max: 16}),
		check('company_cp').optional({checkFalsy: true}).isNumeric().isLength({min:5, max:6}),
		check('company_adresse').isLength({min: 4}),
		check('company_city').isLength({min: 2}),
	], async function(req, res) {
		const validationErrors = validationResult(req);
		if (!validationErrors.isEmpty()) {
			console.dir(validationErrors);
			console.log('VALIDATION ERROR');
			res.status(400).json({message: "inputs non valides"});
		}
		else {		
			try {				
				let userInfos = await User.confirm(req.body);
				console.dir(userInfos);
				await mailController.sendMailJet(userInfos.email, userInfos.first_name, 'inscription-confirmation');
				await User.clearActivationToken(req.params.id_user);
				let successMessage = `USER CONFIRMATION DONE FOR USER ${userInfos.id}`;
				await writeLog('success', successMessage);
				await writeLogSheets.launch(successMessage, 'app');						
				res.status(200).json({message: 'Inscription finalisée !', error: false});
			}
			catch(err) {
				let errMessage = `CONFIRM USER - Problème rencontré: ${err} POUR USER ${req.body.id}`;
				await writeLog('error', errMessage);
				await writeLogSheets.launch(errMessage, 'app');					
				res.status(500).json({message: "Problème lors de l'enregistrement", error: true});
			}
		}
})

// modification d'un user
app.put('/user-manage/:id_user', [
		check('first_name').optional({checkFalsy: true}).isLength({min: 2}).trim(),
		check('last_name').optional({checkFalsy: true}).isLength({min: 2}).trim(),
		check('tel').optional({checkFalsy: true}).isLength({min: 10, max: 14}),
		check('password').optional({checkFalsy: true}).isLength({min: 6}),
		check('company_name').optional({checkFalsy: true}).isLength({min: 2}).trim(),
		check('siret').optional({checkFalsy: true}).isLength({min: 14}).trim(),
		check('tva').optional({checkFalsy: true}).isLength({min: 11, max: 16}),
		check('siret').optional({checkFalsy: true}).isNumeric().isLength({min: 13, max: 16}),
		check('company_cp').optional({checkFalsy: true}).isNumeric().isLength({min:5, max:6}),
		check('new_email').optional({checkFalsy: true}).isEmail()
	], async function(req, res) {
	let tokenCheck = await jwtManager.tokenVerification(req.cookies.argos_token);
	if (tokenCheck === false) {	
		res.status(403).render('index.ejs', {});		
	}
	else {		
		const validationErrors = validationResult(req);
		if (!validationErrors.isEmpty()) {
			res.status(400).json({validationErrors});
		}
		else {		
			try {	
				console.log('UPDATE');
				let id_stripe = await User.getStripeId(req.params.id_user);
				let result = false;
				if (req.body.mode == 'infos') {
					result = await User.updateInfos(req.params.id_user, req.body);
					if (id_stripe !== null) {
						await STRIPE_API.updateCustomerInfos(req.body, id_stripe);
					}
				}
				else if (req.body.mode == 'password') {
					result = await User.updatePassword(req.params.id_user, req.body);
				}
				else if (req.body.mode == 'company') {
					result = await User.updateCompany(req.params.id_user, req.body);
					if (id_stripe !== null) {
						await STRIPE_API.updateCustomerCompanyInfos(req.body, id_stripe);
					}
				}
				else if (req.body.mode == 'email') {
					result = await User.updateEmail(req.params.id_user, req.body.new_email);
					if (id_stripe !== null) {
						await STRIPE_API.updateCustomerEmail(req.body.new_email, id_stripe);
					}
				}	
				else if (req.body.mode == 'email-alert') {
					result = await User.updateEmailAlert(req.params.id_user, req.body.new_email);
				}					
				else if (req.body.mode == 'email-alert-enabled') {
					result = await User.updateEmailAlertEnabled(req.params.id_user, req.body.email_alert);
				}		
				
				if (result) {
					await writeLog('success', `USER ${req.params.id_user} UPDATED`);
					await writeLogSheets.launch(`USER ${req.params.id_user} UPDATED`, 'app');	
					res.status(200).json({message: 'Utilisateur mis à jour !'});
				}
				else {
					res.status(500).json({message: "Problème lors de la mise à jour"});
				}	
			}
			catch(err) {
				console.log(err);
				let errMessage = `EDIT USER - Problème rencontré: ${err} POUR USER ${req.params.id_user}`;
				await writeLog('error', errMessage);
				await writeLogSheets.launch(errMessage, 'app');					
				res.status(500).send({message: err})
			}
		}
	}
})

// Suppression d'un user
app.delete('/user-manage/:id_user', async function(req, res) {
	let tokenCheck = await jwtManager.tokenVerification(req.cookies.argos_token);
	if (tokenCheck === false) {	
		res.status(403).render('index.ejs', {});		
	}
	else {		
		try {		
			let result = await User.delete(req.params.id_user);
			if (result) {
				if (result === true) {
					await writeLog('success', `USER ${req.params.id_user} DELETED`);
					await writeLogSheets.launch(`USER ${req.params.id_user} DELETED`, 'app');	
					res.status(200).json({message: "Utilisateur supprimé"});
				}
				else {
					await writeLog('error', `ERROR WHILE REMOVING USER ${req.params.id_user}`);
					res.status(500).json({message: "Problème lors de la suppression"});
				}
			}
		}
		catch(e) {
			console.log(e);
			res.status(500).send({message: e})
		}
	}		
})

app.post('/station-manage/', [
		check('station_name').isLength({min: 2}).trim(),
		check('station_street').isLength({min: 5}).trim(),
		check('station_city').isLength({min: 4}).trim(),
		check('station_cp').isNumeric().isLength({min: 5, max:6}).trim(),
		check('mosaic_username').isLength({min: 2}),
		check('mosaic_password').isLength({min: 2}),
		check('roulezeco_username').isLength({min: 2}),
		check('roulezeco_password').isLength({min: 2}),
		check('scraping_time').isLength({min: 5}),
	],
 async function(req, res) {
	let tokenCheck = await jwtManager.tokenVerification(req.cookies.argos_token);
	if (tokenCheck === false) {	
		res.status(403).render('index.ejs', {});		
	}
	else {	
		const validationErrors = validationResult(req);
		if (!validationErrors.isEmpty()) {
			console.dir(validationErrors);
			res.status(400).send(validationErrors);
		}	
		else {	

			try  {	
				let id_user = tokenCheck.idUser;
				let datas = req.body;
				datas['id_user'] = id_user;
				let crypted_mosaic_password = encrypt_nohash.encrypt(datas['mosaic_password']);
				datas['crypted_mosaic_password'] = crypted_mosaic_password;
				let crypted_roulezeco_password = encrypt_nohash.encrypt(datas['roulezeco_password']);
				datas['crypted_roulezeco_password'] = crypted_roulezeco_password;		
				let id_station = await Station.create(datas);
				datas['id_station'] = id_station;
				// if (datas['oils']) {				
				// 	for (let i=0; i<datas['oils'].length; i++) {
				// 		await StationOil.create(datas['oils'][i].id, datas['oils'][i].name, id_station);
				// 	}
				// }
				let automationInfos = await Automation.create(datas);
				
				let successMessage = `NEW STATION CREATED FOR USER ${id_user}`;
				await writeLog('success', successMessage);
				await writeLogSheets.launch(successMessage, 'app');
				res.status(200).json({message: 'Nouvelle station ajoutée'});
			}
			catch(err) {
				console.log(err);
				let errMessage = `ADD STATION - Problème rencontré: ${err} POUR USER ${id_user}`;
				await writeLog('error', errMessage);
				await writeLogSheets.launch(errMessage, 'app');
				return res.status(500).json({message: 'Problème rencontré lors de la sauvegarde, veuillez réessayer plus tard.'});	
			}
		}	 	
	}
})

app.put('/station-manage/:station_id/:automation_id', [
		check('station_name').isLength({min: 2}).trim(),
		check('station_street').isLength({min: 5}).trim(),
		check('station_city').isLength({min: 4}).trim(),
		check('station_cp').isNumeric().isLength({min: 5, max:6}).trim()
	], async function(req, res) {
	let tokenCheck = await jwtManager.tokenVerification(req.cookies.argos_token);
	if (tokenCheck === false) {	
		res.status(403).render('index.ejs', {});		
	}
	else {	
		const validationErrors = validationResult(req);
		if (!validationErrors.isEmpty()) {
			console.dir(validationErrors);
			res.status(400).send(validationErrors);		}	
		else {		
			let id_station = req.params.station_id;
			let id_automation = req.params.automation_id;
			let id_user = tokenCheck.idUser;
			let datas = req.body;
			try  {	
				datas['id_user'] = id_user;
				let crypted_mosaic_password = encrypt_nohash.encrypt(datas['mosaic_password']);
				datas['crypted_mosaic_password'] = crypted_mosaic_password;
				let crypted_roulezeco_password = encrypt_nohash.encrypt(datas['roulezeco_password']);
				datas['crypted_roulezeco_password'] = crypted_roulezeco_password;				
				datas['id_station'] = id_station;
				datas['id_automation'] = id_automation;
				await Station.update(datas);
				datas['id_station'] = id_station;
				// if (datas['oils']) {
				// 	await StationOil.clearAll(id_station);			
				// 	for (let i=0; i<datas['oils'].length; i++) {
				// 		await StationOil.create(datas['oils'][i].id, datas['oils'][i].name, id_station);
				// 	}		
				// }
				let automationInfos = await Automation.update(datas);
				await axios.put(URL_ARGOS_SCRAPER+'edit-automation/', {automationInfos});
				let successMessage = `STATION ${id_station} UPDATED FOR USER ${id_user}`;
				await writeLog('success', successMessage);
				await writeLogSheets.launch(successMessage, 'app');
				res.status(200).json({message: 'Station mise à jour'});
			}
			catch(err) {
				console.log(err);
				let errMessage = `UPDATE STATION - Problème rencontré pour la station ${id_station}: ${err}`;
				await writeLog('error', errMessage);
				await writeLogSheets.launch(errMessage, 'app');
				return res.status(500).json({message: 'Problème rencontré lors de la sauvegarde, veuillez réessayer plus tard.'});	
			}
		}		
	}
})

app.get('/station-oils/:station_id', async function(req, res) {
	let tokenCheck = await jwtManager.tokenVerification(req.cookies.argos_token);
	if (tokenCheck === false) {	
		res.status(403).render('index.ejs', {});		
	}
	else {	
		try  {	
			let station_id = req.params.station_id;
			let oils_id = await StationOil.getByStationId(station_id);
			let oilsTab = [];
			for (let i=0; i<oils_id.length; i++) {
				let oil = await Oil.getById(oils_id[i].id_oil);
				oilsTab[i] = oil;
				oilsTab[i]['disrupt'] = oils_id[i].disrupt;
				let disrupt_date = oils_id[i].last_disrupt_date;
				if (oilsTab[i]['disrupt'] === true && disrupt_date !== null) {
					const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
					disrupt_date = disrupt_date.toLocaleDateString('fr-FR', options);
					// let disrupt_date_split = disrupt_date.split('-');
					// let disrupt_date_formatted = `${disrupt_date_split[2]} - ${disrupt_date_split[1]} - ${disrupt_date_split[0]}`;
					oilsTab[i]['last_disrupt_date'] = disrupt_date;
				}
			}
			res.status(200).json(oilsTab);
		}
		catch(e) {
			console.log(e);
			return res.status(500).json({message: e});	
		}	
	}

})

app.delete('/station/:station_id', async function(req, res) {
	let tokenCheck = await jwtManager.tokenVerification(req.cookies.argos_token);
	if (tokenCheck === false) {	
		res.status(403).render('index.ejs', {});		
	}
	else {	
		try  {	
			if (req.body.subscription_id != 0 && req.body.subscription_id != '') {
				await STRIPE_API.cancelSubscription(req.body.subscription_id);
			}
			await Station.delete(req.params.station_id);
			let automationId = req.body.automation_id;
			await axios.delete(URL_ARGOS_SCRAPER+'delete-automation/'+automationId, {});
			let successMessage = `STATION ${req.params.station_id} DELETED`;
			await writeLog('success', successMessage);	
			await writeLogSheets.launch(successMessage, 'app');					
			res.status(200).send({message: 'Station supprimée'});
		}
		catch(err) {
			console.log(err);
			let errMessage = `DELETE STATION - Problème rencontré pour la station ${req.params.station_id}: ${err}`;
			await writeLog('error', errMessage);	
			await writeLogSheets.launch(errMessage, 'app');		
			res.status(500).send({message: 'Erreur lors de la suppression...'});
		}
	}	
})

app.post('/disrupts/', async function(req, res) {
	let tokenCheck = await jwtManager.tokenVerification(req.cookies.argos_token);
	if (tokenCheck === false) {	
		res.status(403).render('index.ejs', {});		
	}
	else {	
		try  {	
			let station_id = req.body.station_id;
			delete req.body.station_id;
			let disruptInfos = [];
			for (info in req.body) {
				let idOil = info;
				let disruptOil = req.body[info];
				let infos = {
					idOil: idOil,
					disruptOil: disruptOil,
					idStation: station_id
				}
				disruptInfos.push(infos);
			}

			let automationInfos = await Automation.getByStationId(station_id);
			let infosScraping = {
				roulezeco_username: automationInfos.roulezeco_username,
				roulezeco_password: encrypt_nohash.decrypt(JSON.parse(automationInfos['roulezeco_password'])),
				disruptInfos: disruptInfos,
				automation_id: automationInfos['id']
			};
			let setDisruptResult = await axios.post(URL_ARGOS_SCRAPER+'set-disrupts/', {infosScraping});
			if (setDisruptResult.data === true) {
				for (infos of disruptInfos) {
					let disruptResponse = await StationOil.setDisrupt(infos);				
				}
				res.status(200).json({message: 'Ruptures mises à jour'});
			}

			else {
				res.status(500).json({message: 'Erreur de connexion, veuillez réessayer'});
			}

		}
		catch(e) {
			console.log(e);
			res.status(500).json({message: e});
		}
	}
})

app.get('/disrupts/:station_id', async function(req, res) {
	let tokenCheck = await jwtManager.tokenVerification(req.cookies.argos_token);
	if (tokenCheck === false) {	
		res.status(403).render('index.ejs', {});		
	}
	else {	
		try  {	
			let disruptTotal = await StationOil.getDisruptTotal(req.params.station_id);
			res.status(200).json({disruptTotal: disruptTotal});
		}
		catch(e) {
			console.log(e);
			res.status(500).json({message: e});
		}	
	}
})

app.get('/test-credentials/:automation_id', async function(req, res){
	let tokenCheck = await jwtManager.tokenVerification(req.cookies.argos_token);	
	if (tokenCheck === false) {	
		res.status(403).render('index.ejs', {});
	}
	else {	
		let automation_id = req.params.automation_id;
		try {		
			let automation = await Automation.getById(automation_id);
			let mosaic_password = encrypt_nohash.decrypt(JSON.parse(automation['mosaic_password']));
			let roulezeco_password = encrypt_nohash.decrypt(JSON.parse(automation['roulezeco_password'])); 
			let credentials = {
				mosaic_password: mosaic_password,
				roulezeco_password: roulezeco_password,
				mosaic_username: automation['mosaic_username'],
				roulezeco_username: automation['roulezeco_username'],
				automation_id: automation['id']
			};
			let testResults = await axios.post(URL_ARGOS_SCRAPER+'test-credentials/', {credentials});
			if (testResults.data.roulezecoTest.error === true) {
				await Automation.updateRoulezecoState(automation_id, 'Erreur');
			}
			else {
				await Automation.updateRoulezecoState(automation_id, 'Actif');	
			}
			if (testResults.data.mosaicTest.error === true) {
				await Automation.updateMosaicState(automation_id, 'Erreur');
			}
			else {
				await Automation.updateMosaicState(automation_id, 'Actif');	
			}			
			res.status(200).send(testResults['data']);
		}
		catch(err) {
			console.log(err);
			res.status(500).send({message: 'Problème rencontré lors du test, veuillez réessayer plus tard.'});
		}
	}	
})

app.get('/profil/:user_id', async function(req, res) {
	let tokenCheck = await jwtManager.tokenVerification(req.cookies.argos_token);	
	if (tokenCheck === false) {	
		res.status(403).render('index.ejs', {});		
	}
	else {	
		let decodedToken = await jwtManager.tokenDecode(req.cookies.argos_token);
		if (decodedToken.idUser != req.params.user_id) {
			res.status(403).render('page-error.ejs');
		}
		else {		
			let userInfos = await User.getById(req.params.user_id);
			let paymentInfos = {
				cb: null,
				sepa: null
			};
			if (userInfos.cb_infos != null) {		
				paymentInfos.cb = JSON.parse(userInfos.cb_infos);
				let cb_num = paymentInfos.cb.cardNumber;
				cb_num = cb_num.substr(0, 5) + 'XXXX XXXX' + cb_num.substr(5 + 9);
				paymentInfos.cb.cardNumber = cb_num;			
			}
			if (userInfos.sepa_infos != null) {
				paymentInfos.sepa = JSON.parse(userInfos.sepa_infos);
				let iban_num = paymentInfos.sepa.iban;
				iban_num = iban_num.substr(0, 5) + 'XXXX XXXX XXXX XXXX' + iban_num.substr(5 + 19);
				paymentInfos.sepa.iban = iban_num;
			}
			res.status(200).render('profile.ejs', {userInfos, paymentInfos});
		}
	}	
})

app.get('/invoices/:user_id', async function(req, res) {
	let tokenCheck = await jwtManager.tokenVerification(req.cookies.argos_token);	
	if (tokenCheck === false) {	
		res.status(403).render('index.ejs', {});		
	}
	else {	
		let decodedToken = await jwtManager.tokenDecode(req.cookies.argos_token);
		if (decodedToken.idUser != req.params.user_id) {
			res.status(403).render('page-error.ejs');
		}
		else {		
			try {
				let userInfos = await User.getById(req.params.user_id);
				if (userInfos.id_stripe) {			
					let invoices = await STRIPE_API.getInvoices(userInfos.id_stripe);
					let invoicesList = invoices.data;
					invoicesInfos = [];
					for (let i=0; i<invoicesList.length; i++) {
						let invoiceInfos = {				
							id: invoicesList[i].id,
							status: invoicesList[i].status,
							number: invoicesList[i].number,
							amount: invoicesList[i].total.toString().substr(0,2) + ',' + invoicesList[i].total.toString().substr(2,2),
							currency: invoicesList[i].currency,
							date: moment.unix(invoicesList[i].created).format("DD/MM/YYYY"),
							url: invoicesList[i].invoice_pdf
						};
						invoicesInfos.push(invoiceInfos);
					}

					res.status(200).render('invoices.ejs', {userInfos, invoicesInfos});
				}
				else {
					let invoicesInfos = [];
					res.status(200).render('invoices.ejs', {userInfos, invoicesInfos});
				}
			}
			catch(err) {
				console.log(err);
				res.status(500).send({message: err});			
			}
		}
	}	
})

app.get('/prices/:user_id', async function(req, res) {
	let tokenCheck = await jwtManager.tokenVerification(req.cookies.argos_token);	
	if (tokenCheck === false) {	
		res.status(403).render('index.ejs', {});		
	}
	else {	
		let decodedToken = await jwtManager.tokenDecode(req.cookies.argos_token);
		if (decodedToken.idUser != req.params.user_id) {
			res.status(403).render('page-error.ejs');
		}
		else {		
			let userInfos = await User.getById(req.params.user_id);	
			res.status(200).render('prices.ejs', {userInfos});
		}
	}
})

app.put('/payment/:user_id', async function(req, res) {
	let tokenCheck = await jwtManager.tokenVerification(req.cookies.argos_token);	
	if (tokenCheck === false) {	
		res.status(403).render('index.ejs', {});		
	}
	else {	
		try {	
			let user_id = req.params.user_id;
			let payment_type = req.body.payment_type;
			let payment_infos = req.body.infos_payment;
			if (payment_type == 'cb') {
				await User.setCreditCard(payment_infos, user_id);
				res.status(200).send({message: 'Carte de crédit enregistrée !'});
			}
			else if (payment_type == 'sepa') {
				await User.setSepa(payment_infos, user_id);
				res.status(200).send({message: 'IBAN enregistré !'});
			}
		}
		catch(err) {
			console.log(err);
			res.status(500).send({message: err});
		}
	}	
})

app.get('/logout/', async function(req, res) {
	res.clearCookie('argos_token');	
	res.redirect('/');
})


app.get('/customerView', (req, res) => {
  STRIPE_API.getAllProductsAndPlans().then(products => {
    products = products.filter(product => {
      return product.plans.length > 0;
    });

    console.dir(products);
    console.dir(products[0].plans);

    res.render('stripe/customerView.ejs', {products: products});
  });
});


app.get('/signUp/:user_id/:station_id', (req, res) => {
  STRIPE_API.getAllProductsAndPlans().then(products => {
		products = products.filter(product => {
		  return product.plans.length > 0;
		});

		product = products[0];

		console.dir(product);

		var plan = {
			id: product.plans[0].id,
			name: product.name,
			amount: product.plans[0].amount,
			interval: product.plans[0].interval,
			interval_count: product.plans[0].interval_count
		}

		let station_id = req.params.station_id;

		console.dir(plan);

		res.render('stripe/payment.ejs', {user_id : req.params.user_id, 
			product: product, plan: plan, station_id: station_id, success: null});
	})
});


app.get('/sepa/:user_id', function(req, res) {
  STRIPE_API.getAllProductsAndPlans().then(products => {
		products = products.filter(product => {
		  return product.plans.length > 0;
		});

		product = products[0];

		console.dir(product);

		var plan = {
			id: product.plans[0].id,
			name: product.name,
			amount: product.plans[0].amount,
			interval: product.plans[0].interval,
			interval_count: product.plans[0].interval_count
		}

		console.dir(plan);
		
		res.render('stripe/sepa.ejs', {user_id : req.params.user_id, product: product, plan: plan, success: null});
	})

})

app.get('/subscriptions/:user_id', async function(req, res) {
	let user_id_stripe = await User.getStripeId(req.params.user_id);
	console.dir(user_id_stripe);
	let subscriptions = await STRIPE_API.getSubscriptionsByUser(user_id_stripe);
	console.dir(subscriptions);
	for (subscription of subscriptions.data) {
		console.dir(subscription.items.data[0].metadata);
	}
	res.render('stripe/subscriptions.ejs', {subscriptions: subscriptions});
})

app.delete('/subscription/:id_subscription', async function(req, res) {
	let id_subscription = req.params.id_subscription;
	console.log(id_subscription);
	try {	
		await STRIPE_API.cancelSubscription(id_subscription);
		res.status(200).send({message: 'Abonnement résilié'});
	}
	catch(err) {
		console.log(err);
		res.status(500);
	}
})

app.post('/user-add-cb/:user_id', async function(req, res) {
	let tokenCheck = await jwtManager.tokenVerification(req.cookies.argos_token);	
	if (tokenCheck === false) {	
		res.status(403).render('index.ejs', {});		
	}
	else {	
		try {
			let card_infos = req.body;
			console.dir(card_infos);
			let user_id_stripe = await User.getStripeId(req.params.user_id);
			console.log(user_id_stripe);
			if (user_id_stripe == null) {
				console.log(' §§§§ CREATE CUSTOMER §§§§§');
				user_id_stripe = await STRIPE_API.createCustomer(card_infos)
		    	await User.setStripeId(req.params.user_id, user_id_stripe);		
			}
			await User.setCreditCard(card_infos, req.params.user_id);
			let card_response = await STRIPE_API.createPaymentMethodCard(card_infos);
			let card_id = card_response.id;
			let attachment_response = await STRIPE_API.attachPaymentMethod(user_id_stripe, card_id);
			console.dir(attachment_response);
			console.log(card_id);
			await STRIPE_API.updateCustomerDefaultPaymentMethod(user_id_stripe, card_id);
			await User.setPaymentMethodId(card_id, req.params.user_id);
			res.status(200).send({message: 'Moyen de paiement enregistré !'});			
		}
		catch(err) {
			console.log(err);
			res.status(500).send({message: "Problème lors de l'enregistrement"})
		}
	}	
})

app.post('/user-add-sepa/:user_id', async function(req, res) {
	let tokenCheck = await jwtManager.tokenVerification(req.cookies.argos_token);	
	if (tokenCheck === false) {	
		res.status(403).render('index.ejs', {});		
	}
	else {	
		try {
			let sepa_infos = req.body;
			console.dir(sepa_infos);
			let user_id_stripe = await User.getStripeId(req.params.user_id);
			console.log(user_id_stripe);
			if (user_id_stripe == null) {
				user_id_stripe = await STRIPE_API.createCustomer(sepa_infos)				
		    	await User.setStripeId(req.params.user_id, user_id_stripe);		
			}
			await User.setSepa(sepa_infos, req.params.user_id);
			let sepa_response = await STRIPE_API.createPaymentMethodSepa(sepa_infos);
			let sepa_id = sepa_response.id;
			let attachment_response = await STRIPE_API.attachPaymentMethod(user_id_stripe, sepa_id);
			await STRIPE_API.updateCustomerDefaultPaymentMethod(user_id_stripe, sepa_id);
			await User.setPaymentMethodId(sepa_id, req.params.user_id);
			console.dir(attachment_response);
			res.status(200).send({message: 'Moyen de paiement enregistré !'});			
		}
		catch(err) {
			console.log(err);
			res.status(500).send({message: "Problème lors de l'enregistrement"})
		}
	}	
})

app.post('/station-activate/', async function(req, res) {
	let tokenCheck = await jwtManager.tokenVerification(req.cookies.argos_token);	
	let user_id = req.body.id_user;
	let station_id = req.body.id_station;
	let station_name = req.body.station_name;
	if (tokenCheck === false) {	
		res.status(403).render('index.ejs', {});		
	}
	else {	
		STRIPE_API.getAllProductsAndPlans().then(async function(products) {
			products = products.filter(product => {
			  return product.plans.length > 0;
			});

			product = products[0];

			let plan = {
				id: product.plans[0].id,
				name: product.name,
				amount: product.plans[0].amount,
				interval: product.plans[0].interval,
				interval_count: product.plans[0].interval_count
			};

			let user_id_stripe = await User.getStripeId(user_id);

			let infos = {
				customer_id: user_id_stripe,
				plan_id: plan.id,
				station_id: station_id,
				station_name: station_name
			};

		  	try {
		  // 		let paymentMethodId = await User.getPaymentMethodId(user_id);
		  // 		console.dir(paymentMethodId);
		  // 		await STRIPE_API.updateCustomerDefaultPaymentMethod(user_id_stripe, paymentMethodId);
				// let subscription = await STRIPE_API.createSubscription(infos);
				// await Station.activate(station_id, subscription.id);
				await Station.activate(station_id, 0);
				let automation = await Automation.getByStationId(station_id);
				await Automation.activate(automation.id);
				await axios.post(URL_ARGOS_SCRAPER+'add-automation', {automation});
				await writeLog('success', `Station ${station_id} activated FOR USER ${user_id}`);
				await writeLogSheets.launch(`Station ${station_id} activated FOR USER ${user_id}`, 'app');
				// res.status(200).send({message: 'Abonnement activé pour la station '+station_name});
				res.status(200).send({message: 'Activation effectuée pour la station '+station_name});
		  	}
			catch(err) {
				console.log(err);
				let errMessage = `STATION ACTIVATE - Problème rencontré : ${err} POUR USER ${user_id} ET STATION ${station_id}`;
				await writeLog('error', errMessage);
				await writeLogSheets.launch(errMessage, 'app');				
			    res.status(500).send({message: "Erreur lors de l'activation"});
			}	 
		})		
	}	
})

app.post('/update-oil-list/', async function(req, res) {
	try {	
		let automationInfos = await Automation.getByStationId(req.body.id_station);
		let roulezeco_username = automationInfos.roulezeco_username;
		let roulezeco_password = encrypt_nohash.decrypt(JSON.parse(automationInfos['roulezeco_password'])); 
		let automation_id = automationInfos.id;
		let oils = await axios.post(URL_ARGOS_SCRAPER+'detect-oils/', {roulezeco_username, roulezeco_password, automation_id});
		console.dir(oils);
		console.log('&&&&&&&&&&&&&&&&&&&&&&&&&');
		await StationOil.clearAll(req.body.id_station);		
		for (oilInfos of oils.data.oils) {
			await StationOil.create(oilInfos.id, oilInfos.name, req.body.id_station, oilInfos.disrupt);
		}
		await writeLog('success', `UPDATE OIL LIST SUCCEED FOR STATION ${req.body.id_station}`);
		await writeLogSheets.launch(`UPDATE OIL LIST SUCCEED FOR STATION ${req.body.id_station}`, 'app');
		res.status(200).send({message: 'Liste mise à jour'});
	}
	catch(err) {
		console.log(err);
		let errMessage = `UPDATE OIL LIST - Problème rencontré : ${err} POUR STATION ${req.body.id_station}`;
		await writeLog('error', errMessage);
		await writeLogSheets.launch(errMessage, 'app');			
		res.status(500).send({message: 'Problème de connexion'});
	}
})

server.listen(8080, function() {
    console.log('ARGOS APP RUNNING...');
});
