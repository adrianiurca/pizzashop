/*
* Create and export configuration variables
*
*/

// Container for all the environments
var environments = {};

// Staging (default) environment
environments.staging = {
	'httpPort' : 3000,
	'httpsPort' : 3001,
	'envName' : 'staging',
	'hashingSecret' : 'thisIsASecret',
	'stripe' : {
		'api_key' : '',
		'hostname' : 'api.stripe.com'
	},
	'mailgun' : {
		'api_key' : '',
		'hostname' : 'api.mailgun.net',
		'domain' : ''
	}
};

// Production environment
environments.production = {
	'httpPort' : 5000,
	'httpsPort' : 5001,
	'envName' : 'production',
	'hashingSecret' : 'thisIsAlsoASecret',
	'stripe' : {
		'api_key' : '',
		'hostname' : 'api.stripe.com'
	},
	'mailgun' : {
		'api_key' : '',
		'hostname' : 'api.mailgun.net',
		'domain' : ''
	}
};

// Determine which environment was passed as a command-line argument
var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check if that the current environment is one of the environments above, if not, default to staging
var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

// Export the module
module.exports = environmentToExport;