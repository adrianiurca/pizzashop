/*
* Primay file for the API
*
*/

// Dependencies
var server = require('./lib/server');
var _data  = require('./lib/data');

// Declare the app
var app = {};

// Delete expired tokens
app.deleteExpiredTokens = function() {
	// List all tokens
	_data.list('tokens',function(listErr,tokensList) {
		if(!listErr && tokensList) {
			if(typeof(tokensList) == 'object' && tokensList instanceof Array && tokensList.length > 0) {
				// Read each token and check expiration date
				tokensList.forEach(function(token) {
					_data.read('tokens',token,function(readErr,tokenData) {
						if(!readErr && tokenData) {
							// Check if token is expired, then delete it
							if(tokenData.expires <= Date.now()) {
								_data.delete('tokens',token,function(deleteErr) {
									if(!deleteErr) {
										console.log('Token was deleted -> ',token);
									} else {
										console.log('Could not delete a specified token');
									}
								});
							}
						} else {
							console.log('Could not read a specified token:',token);
						}
					});
				});
			} else {
				console.log('There are not tokens');
			}
		} else {
			console.log('Could not read the tokens directory');
		}
	});
};

app.loop = function() {
	setInterval(function() {
		app.deleteExpiredTokens();
	},1000*60*30);
};

// Init function
app.init = function() {
	// Start the server
	server.init();
	
	// Delete expired tokens immediately
	app.deleteExpiredTokens();
	
	// Call the loop, so expired tokens will be deleted onLine
	app.loop();
};

// Execute
app.init();

// Export the app
module.exports = app;