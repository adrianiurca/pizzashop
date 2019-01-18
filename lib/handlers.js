/*
* Request handlers
*
*/

// Dependencies
var _data = require('./data');
var helpers = require('./helpers');
var config = require('./config');
var _menu = require('./menu');

// Define the handlers
var handlers = {};

// Users handler
handlers.users = function(data,callback) {
	var acceptableMethods = ['post','get','put','delete'];
	if(acceptableMethods.indexOf(data.method) > -1) {
		handlers._users[data.method](data,callback);
	} else {
		callback(405);
	}
};

// Container for users submethods
handlers._users = {};

// Users - post
// Required data: firstName, lastName, email, password, street address
// Optional data: none
handlers._users.post = function(data,callback) {
	// Check all requred fields are filled out
	var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
	var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
	var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
	var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
	var address = typeof(data.payload.address) == 'string' && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false;
	var currency = typeof(data.payload.currency) == 'string' && ['eur','usd'].indexOf(data.payload.currency) > -1 ? data.payload.currency : false;
	var creditCard = typeof(data.payload.creditCard) == 'string' && ['visa','mastercard','amex'].indexOf(data.payload.creditCard) > -1 ? data.payload.creditCard : false;
	
	if(firstName && lastName && email && password && address && currency && creditCard) {
		// Make sure that the user doesn't exist
		_data.read('users',email,function(err,data) {
			if(err) {
				// Hash the password
				var hashedPassword = helpers.hash(password);
				
				if(hashedPassword) {
					// Create the user object
					var userObject = {
						'firstName' : firstName,
						'lastName' : lastName,
						'email' : email,
						'hashedPassword' : hashedPassword,
						'address' : address,
						'currency' : currency,
						'creditCard' : creditCard
					};
				
					// Store the user
					_data.create('users',email,userObject,function(err) {
						if(!err) {
							callback(200);
						} else {
							console.log(err);
							callback(500,{'Error' : 'Could not create the new user'});
						}
					});
				} else {
					callback(500,{'Error' : 'Could not hash the user\'s password'});
				}
			} else {
				callback(400,{'Error' : 'A user with that email address already exists'});
			}
		});
	} else {
		callback(400,{'Error' : 'Missing required fields'});
	}
};

// Users - get
// Required data: email
// Optional data: none
handlers._users.get = function(data,callback) {
	// Check if email is valid
	if(typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0) {
		helpers.validateEmail(data.queryStringObject.email.trim(),function(isEmailValid) {
			if(isEmailValid) {
				// Get the token from headers
				var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
				handlers._tokens.verify(token,phone,function(tokenIsValid) {
					if(tokenIsValid) {
						// Lookup the user
						_data.read('users',data.queryStringObject.email.trim(),function(err,data) {
							if(!err && data) {
								// Remove the hashed password from the user object before returning it to the requester
								delete data.hashedPassword;
								callback(200,data);
							} else {
								callback(404);
							}
						});
					} else {
						callback(403,{'Error' : 'Missing required token in header, or token is invalid'});
					}
				});
			} else {
				callback(400,{'Error' : 'Email is invalid'});
			}
		});
	} else {
		callback(400,{'Error' : 'Missing required field'});
	}
};

// Users - put
// Required data: email
// Optional data: firstName, lastName, password, address, currency, creditCard(at least one must be specified)
handlers._users.put = function(data,callback) {
	// Check for the required field
	if(typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0) {
		// Check for the optional fields
		var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
		var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
		var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
		var address = typeof(data.payload.address) == 'string' && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false;
		var currency = typeof(data.payload.currency) == 'string' && ['eur','usd'].indexOf(data.payload.currency) > -1 ? data.payload.currency : false;
		var creditCard = typeof(data.payload.creditCard) == 'string' && ['visa','mastercard','amex'].indexOf(data.payload.creditCard) > -1 ? data.payload.creditCard : false;
	
		helpers.validateEmail(data.queryStringObject.email.trim(),function(isEmailValid) {
			if(isEmailValid) {
				// Get the token from headers
				var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
				handlers._tokens.verify(token,data.queryStringObject.email.trim(),function(tokenIsValid) {
					if(tokenIsValid) {
						// Error if nothing is sent to update
						if(firstName || lastName || password || address || currency || creditCard) {
							// Lookup the user
							_data.read('users',data.queryStringObject.email.trim(),function(err,userData) {
								if(!err && userData) {
									// Update the fields necessary
									if(firstName) {
										userData.firstName = firstName;
									}
					
									if(lastName) {
										userData.lastName = lastName;
									}
					
									if(password) {
										userData.hashedPassword = helpers.hash(password);
									}
									
									if(address) {
										userData.address = address;
									}
									
									if(currency) {
										if(['eur','usd'].indexOf(currency) > -1) {
											userData.currency = currency;
										} else {
											callback(400,{'Error' : 'Currencies accepted are EUR and USD'});
										}
									}
									
									if(creditCard) {
										if(['visa','mastercard','amex'].indexOf(creditCard) > -1) {
											userData.creditCard = creditCard;
										} else {
											callback(400,{'Error' : 'Accepted cards are: visa, mastercard and amex'});
										}
									}
					
									// Store the new updates
									_data.update('users',data.queryStringObject.email.trim(),userData,function(err) {
										if(!err) {
											callback(200);
										} else {
											console.log(err);
											callback(500,{'Error' : 'Could not update the user'});
										}
									});
								} else {
									callback(400,{'Error' : 'The specified user does not exist'});
								}
							});
						} else {
							callback(400,{'Error' : 'Missing fields to update'});
						}
					} else {
						callback(403,{'Error' : 'Missing required token in header, or token is invalid'});
					}
				});
			} else {
				callback(400,{'Error' : 'Email is invalid'});
			}
		});
	} else {
		callback(400,{'Error' : 'Missing required field'});
	}
};

// Users - delete
// Required field: email
handlers._users.delete = function(data,callback) {
	// Check if email is valid
	if(typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0) {
		helpers.validateEmail(data.queryStringObject.email.trim(),function(isEmailValid) {
			if(isEmailValid) {
				// Get the token from headers
				var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
				handlers._tokens.verify(token,data.queryStringObject.email.trim(),function(tokenIsValid) {
					if(tokenIsValid) {
						// Lookup the user
						_data.read('users',data.queryStringObject.email.trim(),function(err,userData) {
							if(!err && userData) {
								_data.delete('users',data.queryStringObject.email.trim(),function(err) {
									if(!err) {
										// Delete token associated with the user
										_data.delete('tokens',token,function(err) {
											if(!err) {
												callback(200);
											} else {
												callback(500,{'Error' : 'Could not delete the specified token'});
											}
										});
									} else {
										callback(500,{'Error' : 'Could not delete the specified user'});
									}
								});
							} else {
								callback(400,{'Error' : 'Could not find specified user'});
							}
						});
					} else {
						callback(403,{'Error' : 'Missing required token in header, or token is invalid'});
					}
				});
			} else {
				callback(400,{'Error' : 'Email is invalid'});
			}
		});
	} else {
		callback(400,{'Error' : 'Missing required field'});
	}
};

// Tokens handler
handlers.tokens = function(data,callback) {
	var acceptableMethods = ['post','get','put','delete'];
	if(acceptableMethods.indexOf(data.method) > -1) {
		handlers._tokens[data.method](data,callback);
	} else {
		callback(405);
	}
};

// Container for tokens submethods
handlers._tokens = {};

// Tokens - post
// Required data: phone, password
// Optional data: none
handlers._tokens.post = function(data,callback) {
	var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
	var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
	
	if(email && password) {
		// Validate email
		helpers.validateEmail(email,function(isEmailValid) {
			if(isEmailValid) {
				// Lookup the user who matches with
				_data.read('users',email,function(err,userData) {
					if(!err && userData) {
						// Hash the sent password, and compare it with password stored in the object data
						var hasshedPassword = helpers.hash(password);
						if(hasshedPassword == userData.hashedPassword) {
							// If valid, create a new token with a random name, set 1 hour expiration in the future
							var tokenId = helpers.createRandomString(20);
							var expires = Date.now() + 1000*60*60;
							var tokenObject = {
								'email' : email,
								'id' : tokenId,
								'shoppingCart' : [],
								'orderCounter' : 0,
								'expires' : expires
							};
					
							// Store the token
							_data.create('tokens',tokenId,tokenObject,function(err) {
								if(!err) {
									callback(200,tokenObject);
								} else {
									callback(500,{'Error' : 'Could not create the new token'});
								}
							});
						} else {
							callback(400,{'Error' : 'Wrong password'});
						}
					} else {
						callback(400,{'Error' : 'Could not find the specified user'});
					}
				});
			} else {
				callback(400,{'Error' : 'Email is invalid'});
			}
		});
	} else {
		callback(400,{'Error' : 'Missing required fields'});
	}
};

// Tokens - get
handlers._tokens.get = function(data,callback) {
	// Check if tokenId is valid
	var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
	if(id) {
		// Lookup the token
		_data.read('tokens',id,function(err,tokenData) {
			if(!err && tokenData) {
				callback(200,tokenData);
			} else {
				callback(404);
			}
		});
	} else {
		callback(400,{'Error' : 'Missing required field'});
	}
};

// Tokens - put
// Required data: id
// Optional Data: extend, items(at least one of them)
handlers._tokens.put = function(data,callback) {
	var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
	var items = typeof(data.payload.items) == 'object' && data.payload.items instanceof Array && data.payload.items.length > 0 ? data.payload.items : false;
	var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
	if(id && (extend || data.payload.items)) {
		// Lookup the token
		_data.read('tokens',id,function(err,tokenData) {
			if(!err && tokenData) {
				if(extend) {
					// Check to make sure the token isn't already expired
					if(tokenData.expires > Date.now()) {
						tokenData.expires = Date.now() + 1000*60*60;
					} else {
						callback(400,{'Error' : 'The token already expired and can not be extended'});
					}
				}
				
				if(items) {
					// Push all items to shoppingCart array
					items.forEach(function(item) {
						tokenData.shoppingCart.push(item);
					});
				}
				
				if(extend || items) {
					// Store the new updates
					_data.update('tokens',id,tokenData,function(err) {
						if(!err) {
							callback(200);
						} else {
							callback(500,{'Error' : 'Could not update the token\'s expiration and items'});
						}
					});
				}
			} else {
				callback(400,{'Error' : 'Specified token does not exist'});
			}
		});
	} else {
		callback(400,{'Error' : 'Missing required fields or fields are invalid'});
	}
};

// Tokens - delete
// Required data: id
// Optional data: none
handlers._tokens.delete = function(data,callback) {
	// Check if tokenId is valid
	var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
	if(id) {
		// Lookup the token
		_data.read('tokens',id,function(err,tokenData) {
			if(!err && tokenData) {
				_data.delete('tokens',id,function(err) {
					if(!err) {
						callback(200);
					} else {
						callback(500,{'Error' : 'Could not delete the specified token'});
					}
				});
			} else {
				callback(400,{'Error' : 'Could not find specified token'});
			}
		});
	} else {
		callback(400,{'Error' : 'Missing required field'});
	}
};

// Verify if a given token id is currently valid for a given user
handlers._tokens.verify = function(id,email,callback) {
	// Lookup for token
	_data.read('tokens',id,function(err,tokenData) {
		if(!err && tokenData) {
			if(tokenData.email == email && tokenData.expires > Date.now()) {
				callback(true);
			} else {
				callback(false);
			}
		} else {
			callback(false);
		}
	});
};

// Menu handler
handlers.menu = function(data,callback) {
	// Get the token from the headers
	var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
	
	// Lookup by reading the token
	_data.read('tokens',token,function(err,tokenData) {
		if(!err && tokenData) {
			if(tokenData.expires > Date.now()) {
				// List the menu items
				_menu.list(function(err,items) {
					if(!err && items) {
						if(typeof(items) == 'object' && items instanceof Array && items.length > 0) {
							callback(200,items);
						} else {
							callback(500,{'Error' : 'Empty menu list'});
						}
					} else {
						callback(500,{'Error' : 'Could not list the items'});
					}
				});
			} else {
				callback(403,{'Error' : 'Token expired'});
			}
		} else {
			callback(403);
		}
	});
};

// Checkout handler
handlers.checkout = function(data,callback) {
	// Get the token form the headers
	var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
	
	// Lookup by reading the token
	_data.read('tokens',token,function(err,tokenData) {
		if(!err && tokenData) {
			if(tokenData.expires > Date.now()) {
				var amount = 0;
				var orderId = token;
				var user = tokenData.email;
				
				// Get the menu items array from menu/menu.json
				_menu.list(function(err,menuItems) {
					if(!err && menuItems) {
						if(typeof(menuItems) == 'object' && menuItems instanceof Array && menuItems.length > 0) {
							// Evaluate the amount
							tokenData.shoppingCart.forEach(function(item) {
								amount += item.numberOfItems * menuItems[item.itemId].price;
							});
				
							// Increment the number of orders made with this token( in this session )
							tokenData.orderCounter++;
				
							// OrderId = tokenId_orderCounter
							orderId += '_'+tokenData.orderCounter.toString();
							
							// Read the currency and creditCard from user file
							_data.read('users',user,function(err,userData) {
								if(!err && userData) {
									// Order object
									var order = {
										'orderId' : orderId,
										'shoppingCart' : tokenData.shoppingCart,
										'currency' : userData.currency,
										'creditCard' : userData.creditCard,
										'amount' : amount*100,
										'date' : helpers.humanReadableDate(),
										'email' : userData.email,
										'firstName' : userData.firstName,
										'lastName' : userData.lastName,
										'address' : userData.address,
										'menuItems' : menuItems
									};
									
									// Process payment
									helpers.processPayment(order,function(stripeError,stripeData) {
										if(!stripeError && stripeData) {
											helpers.sendEmail(order,function(mailgunError,mailgunData) {
												if(!mailgunError && mailgunData) {
													// Initialize orderCounter = 0 and shoppingCart = [] - empty array
													tokenData.orderCounter = 0;
													tokenData.shoppingCart = [];
													
													// Save the updates
													_data.update('tokens',token,tokenData,function(updateErr) {
														if(!updateErr) {
															callback(200);
														} else {
															callback(500,{'Error' : updateErr});
														}
													});
												} else {
													callback(500,{'Error' : mailgunData});
												}
											});
										} else {
											callback(500,{'Error' : stripeData});
										}
									});
								} else {
									callback(500,{'Error' : 'Could not read user\' data'});
								}
							});
							
						} else {
							callback(500,{'Error' : 'Empty menu list'});
						}
					} else {
						callback(500,{'Error' : 'Could not list the items'});
					}
				});
			} else {
				callback(403,{'Error' : 'Token expired'});
			}
		} else {
			callback(403);
		}
	});
};

// Define the not found handler
handlers.notFound = function(data,callback) {
	callback(404);
};

// Export the module
module.exports = handlers;