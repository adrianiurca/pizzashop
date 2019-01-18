/*
* Helpers for various tasks
*
*/

// Dependencies
var crypto = require('crypto');
var config = require('./config');
var querystring = require('querystring');
var https = require('https');
var StringDecoder = require('string_decoder').StringDecoder;

// Container for all helpers
var helpers = {};

// Create a SHA256 hash
helpers.hash = function(str) {
	if(typeof(str) == 'string' && str.length > 0) {
		var hash = crypto.createHmac('sha256',config.hashingSecret).update(str).digest('hex');
		return hash;
	} else {
		return false;
	}
};

// Parse a JSON string to an object in all cases, whitout throwing
helpers.parseJsonToObject = function(str) {
	try {
		var obj = JSON.parse(str);
		return obj;
	} catch(e) {
		return {};
	}
};

// Create a random alphanumeric string of a given length
helpers.createRandomString = function(strLength) {
	strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
	if(strLength) {
		var possibleCharacters = 'qwertyuioplkjhgfdsazxcvbnm0123456789';
		var str = '';
		for(i=1;i<=strLength;i++) {
			var randomChar = possibleCharacters.charAt(Math.floor(Math.random()*possibleCharacters.length));
			str+=randomChar;
		}
		return str;
	} else {
		return false;
	}
};

// Date format DD/MM/YYYY
helpers.humanReadableDate = function() {
	var date = new Date();
	var year = date.getFullYear();
	var month = date.getMonth()+1;
	var day = date.getDate();
	
	if(day < 10) day = '0'+day;
	if(month < 10) month = '0'+month;
	
	return (day+'/'+month+'/'+year);
};

// Process payment
helpers.processPayment = function(orderObject,callback) {
	// Payment payload
	var stripe_payload = {
		'amount' : orderObject.amount,
		'currency' : orderObject.currency,
		'description' : 'Order - '+orderObject.date,
		'source' : 'tok_'+orderObject.creditCard
	};
							
	// Stringify stripe_payload
	var stripe_payload_string = querystring.stringify(stripe_payload);
							
	// Stripe request details
	var stripe_details = {
		'auth' : config.stripe.api_key,
		'hostname' : config.stripe.hostname,
		'method' : 'POST',
		'timeout' : 5*1000,
		'path' : '/v1/charges'
	};
							
	// Stripe payment request
	var stripe_req = https.request(stripe_details,function(res) {
		var decoder = new StringDecoder('utf-8');
		var buffer = '';
		res.on('data',function(dataOutcome) {
			buffer += decoder.write(dataOutcome);
		});
		res.on('end',function() {
			buffer += decoder.end();
			buffer = helpers.parseJsonToObject(buffer);
			if(res.statusCode == 200) {
				callback(false,buffer);
			} else {
				callback(res.statusCode,buffer);
			}
		});
	});
							
	// Set headers
	stripe_req.setHeader('Authorization','Bearer '+config.stripe.api_key);
	stripe_req.setHeader('Content-Type','application/x-www-form-urlencoded');
	stripe_req.setHeader('Content-Length',Buffer.byteLength(stripe_payload_string));
								
	// Error handler
	stripe_req.on('error',function(e) {
		callback(e);
	});
	
	// Timeout handler
	stripe_req.on('timeout',function(e) {
		callback({'Error' : 'stripe_timeout'});
	});
							
	// Write payload
	stripe_req.write(stripe_payload_string);
							
	// End request
	stripe_req.end();
};

// Send email through Mailgun
helpers.sendEmail = function(orderObject,callback) {
	// Email html body
	var email_html_header = '<!DOCTYPE html> \
		<html> \
		<head> \
		<style> \
			table, th, td { \
				border: 1px solid black; \
				border-collapse: collapse; \
			} \
			th, td { \
				padding: 5px; \
			} \
			th { \
				text-align: left; \
			} \
		</style> \
		</head> \
		<body> \
			<h3>Order Info</h3><br> \
			<h4>Name: <b>'+orderObject.firstName+' '+orderObject.lastName+'</b></h4><br>\
			<h4>Delivery address: <b>'+orderObject.address+'</b></h4><br>\
			<h4>Products:</h4><br> \
			<table style="width:100%"> \
				<tr> \
					<th>Item Name</th> \
					<th>item Price</th> \
					<th>Number of items</th> \
					<th>Value</th> \
				</tr>';
			
	var email_html_body = '';
	
	orderObject.shoppingCart.forEach(function(item) {
		var html_str = '<tr>';
		html_str += '<th>'+orderObject.menuItems[item.itemId].name+'</th>';
		html_str += '<th>'+orderObject.menuItems[item.itemId].price+'</th>';
		html_str += '<th>'+item.numberOfItems.toString()+'</th>';
		html_str += '<th>'+(orderObject.menuItems[item.itemId].price*item.numberOfItems).toString()+'</th>';
		html_str += '</tr>';
		email_html_body += html_str;
	});
	
	email_html_body += '</table><br><br><h4>Kind regards,<br>PizzaShop Team</h4></body></html>';
	
	var email_html = email_html_header+email_html_body;
	
	email_html = email_html.replace(/\t/g,'');
	
	// Mailgun payload
	var mailgun_payload = {
		'from' : 'Mailgun Sandbox <postmaster@sandbox6e123f3cacf44b3bb57cabbae700654d.mailgun.org>',
		'to' : orderObject.firstName+' '+orderObject.lastName+' <'+orderObject.email+'>',
		'subject' : 'Order ID: '+orderObject.orderId,
		'text' : 'Hello'+orderObject.firstName,
		'html' : email_html
	};
	
	// Mailgun payload string
	var mailgun_payload_string = querystring.stringify(mailgun_payload);
	
	// Mailgun request details
	var mailgun_details = {
		'auth' : 'api:'+config.mailgun.api_key,
		'hostname' : config.mailgun.hostname,
		'method' : 'POST',
		'timeout' : 5*1000,
		'path' : '/v3/'+config.mailgun.domain+'/messages'
	};
	
	// Create mailgun https request 
	var mailgun_req = https.request(mailgun_details,function(res) {
		var decoder = new StringDecoder('utf-8');
		var buffer = '';
		res.on('data',function(dataOutcome) {
			buffer += decoder.write(dataOutcome);
		});
		res.on('end',function() {
			buffer += decoder.end();
			buffer = helpers.parseJsonToObject(buffer);
			if(res.statusCode == 200) {
				callback(false,buffer);
			} else {
				callback(res.statusCode,buffer);
			}
		});
	});
	
	// Error handler
	mailgun_req.on('error',function(e) {
		callback(e);
	});
	
	// Timeout handler
	mailgun_req.on('timeout',function(e) {
		callback({'Error' : 'mailgun_timeout'});
	});
	
	// Set headers
	mailgun_req.setHeader('Content-Type','application/x-www-form-urlencoded');
	mailgun_req.setHeader('Content-Length',Buffer.byteLength(mailgun_payload_string));
	
	// Write payload
	mailgun_req.write(mailgun_payload_string);
	
	// End request
	mailgun_req.end();
};

// Validate email
helpers.validateEmail = function(email,callback) {
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  callback(re.test(email));
};

// Export the module
module.exports = helpers;