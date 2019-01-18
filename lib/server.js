/*
* Server-related tasks
*
*/

// Dependencies

var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');
var fs = require('fs');
var handlers = require('./handlers');
var helpers = require('./helpers');
var path = require('path');
var util = require('util');

// Instantiate the server module object
var server = {};

// Instantiate the HTTP Server
server.httpServer = http.createServer(function(req,res){
	server.unifiedServer(req,res);
});

// Instantiate the HTPPS Server
server.httpsServerOptions = {
	'key' : fs.readFileSync(path.join(__dirname,'/../https/key.pem')),
	'cert' : fs.readFileSync(path.join(__dirname,'/../https/cert.pem'))
};
server.httpsServer = https.createServer(server.httpsServerOptions,function(req,res){
	server.unifiedServer(req,res);
});

// All the server logic for both http and https server
server.unifiedServer = function(req,res) {
	
	// Get the URL and parse it
	var parsedUrl = url.parse(req.url,true);
	
	// Get the HTPP Method
	var method = req.method.toLowerCase();
	
	// Get the query string as an object
	var queryStringObject = parsedUrl.query;
	
	// Get the path
	var path = parsedUrl.pathname;
	var trimmedPath = path.replace(/^\/+|\/+$/g,'');
	
	// Get the header as an object
	var headers = req.headers;
	
	// Get the payload, if any
	var decoder = new StringDecoder('utf-8');
	var buffer = '';
	req.on('data',function(data){
		buffer += decoder.write(data);
	});
	req.on('end',function(){
		buffer += decoder.end();
		
		// Choose the handler this request should go to, if one is not found the notFound handler
		var chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;
		
		// Construct the data object to send to the handler
		var data = {
			'trimmedPath' : trimmedPath,
			'queryStringObject' : queryStringObject,
			'method' : method,
			'headers' : headers,
			'payload' : helpers.parseJsonToObject(buffer)
		};
		
		// Route the request specified in the router
		chosenHandler(data,function(statusCode,payload) {
			// Use the status code called back by the handler, or default to 200
			statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
			
			// Use the payload called back by the handler, or default to empty object
			payload = typeof(payload) == 'object' ? payload : {};
			
			// Convert the payload to a string
			var payloadString = JSON.stringify(payload);
			
			// Return the response
			res.setHeader('Content-Type','application/json');
			res.writeHead(statusCode);
			res.end(payloadString);
			
			// Log the request path
			if(statusCode == 200) {
				console.log('\x1b[32m%s\x1b[0m',method.toUpperCase()+' /'+trimmedPath+' '+statusCode);
			} else {
				console.log('\x1b[31m%s\x1b[0m',method.toUpperCase()+' /'+trimmedPath+' '+statusCode);
			}
		});
	});
};

// Define a request router
server.router = {
	'users' : handlers.users,
	'tokens' : handlers.tokens,
	'menu' : handlers.menu,
	'checkout' : handlers.checkout
};

// Init function
server.init = function() {
	// Start the HTPP server
	server.httpServer.listen(config.httpPort,function(){
		console.log('\x1b[36m%s\x1b[0m',"the server is listening on port "+config.httpPort+" in "+config.envName+" mode");
	});
	
	// Start the HTPPS Server
	server.httpsServer.listen(config.httpsPort,function(){
		console.log('\x1b[35m%s\x1b[0m',"the server is listening on port "+config.httpsPort+" in "+config.envName+" mode");
	});
};

// Export the module
module.exports = server;