// include libraries
var superagent = require('superagent'),
	common = require('../../../helper/common'),
	auth = require('./index'),
	regexValidate = require('../../../helper/regexValidate');

module.exports = function login(req, res) {
	if (req.session.user) {
		return res.redirect('/');
	} else if (req.method == 'POST') {
		// validate
		req.assert('user', {text: 'username-invalid'}).notEmpty();
		req.assert('password', {text: 'password-blank'}).notEmpty();

		// get errors
		var errors = req.validationErrors();

		var identifier = req.body.user;

		var query = {
			password: req.body.password
		};

		if (regexValidate('email').test(identifier)) {
			query['email'] = identifier;
		} else {
			query['username'] = identifier;
		}

		//form data
		var form = {
			user: JSON.stringify(query)
		};

		//call
		if (!errors) {
			// call
			superagent
				.post(common.getAPIUrl(req) + 'auth/login')
				.set({
					"content-type": "application/json",
				})
				.send(form)
				.end(function (error, response) {
					if (response.statusCode == 200) {
						// store user and key in session
						req.session.user = response.body;
						
						if (req.session.user.partial === false) {
							/**
							 The user has either 2FA disabed or has not set it up yet, and is fully authenticated
							 so we redirect the user to dashboard
							 */
							return res.redirect('/');
						} else {
							/**
							 The user has enabled 2FA, and is not fully authenticated
							 so we redirect the user to verify2FA page
							 */
							return res.redirect('/verify2FA');
						}
					} else {
						req.flash('errors', {
							msg: {
								text: 'error-code-'+response.body.code
							}
						});
						return res.redirect('/login');
					}
				});
		} else {
			req.flash('errors', errors);
			return res.redirect('/login');
		}
	} else {
		// send to login page
		res.render('login', {
			module: 'login',
			server: auth.ini().information
		});
	}
};
