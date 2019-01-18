# pizzashop
Home assignment #2 on Pirple platform Node.JS Master Class

                                    ********** PIZZA-SHOP **************
                                    ** Author: Adrian Iurca ************
                                    ** Email: adrian.iurca@gmail.com ***
                                    ************************************

This application in developed only using node.js utilities, no NPM modules was used.
This application also run a background worker( runs from 30 by 30 minutes ) which deletes all expired tokens.
Pizzashop is a RESTfull API which allows you to use the following services: /users, /tokens, /menu, /checkout.
Pizzashop is able to perform the following commands:

1. Create a user(similar to Sign Up) by performing following JSON command:
   Perform a HTTP/HTTPS request using method POST on hostname = localhost, with port = 3000(for HTTP request) or 3001(for HTTPS            request), using path = /users, with this payload :
    {
      "firstName" : 'your first name',
      "lastName" : 'your last name',
      "email" : 'your_email_address',
      "password" : 'a password chosen by you',
      "address" : 'your street address',
      "currency" : 'chose one of this currencies: eur or usd',
      "creditCard" : 'chose one of this credit card accepted: visa, mastercard or amex'
    }
    
    The response to this request is:
      200,{} - on success 
      an specific error code(400,401,403,404,500),{'Error' : 'Error explanation'} - on failure
    
2. Authenticate a user(similar to Sign In), in pizzashop REST API is performed by creating an authentication token.
   To create an authentication token is neccessary to make an HTTP/HTTPS request using method POST on path = /tokens with the following    payload structure:
     {
       "email" : 'one of the email address registered',
       "password" : 'a matching password for the email address'
     }
     
     The response to this request is:
       - 200 - success code and JSON object specificto a token:
          {
            "email" : a string which contain the email address whichs created the token
            "id" : a randomly generated string by 20 characters length,
            "shoppingCart" : [] - an empty array which will store selected items from pizza menu
            "orderCounter" : 0, a number which will count the orders performed with same token,
            "expires" : a date value -  a token is valid one hour after is created
          }
          
       - an specific error code(400,401,403,404,500) and an error explanation
       
3. Get a user info can be performed with the following HTTP/HTTPS GET request:
   - path: /users
   - in querystring: email value should be an email address stored in app
   - in headers: token value should be a valid token( stored and not expired )
   
   The response will contain an HTTP statusCode: 200 OK or an specific error status code(400,401,403,404,500) and an object depend by      case : 
     on success: an JSON object with all user information, except password
     on error: an JSON object with error explanation
 
4. Update user info can be performed with the following HTTP/HTTPS PUT request:
   - path: /users
   - in querystring: email value should be an email address stored in app
   - in headers: token value should be a valid token( stored and not expired )
   - in payload: only fields which want to update( at least one of them ):
     {
       "email" : "new email address",
       "password" : "new password",
       ...
       and so on
     }
   
   The response will contain an HTTP statusCode: 200 OK or an specific error status code(400,401,403,404,500) with an specific              explanation
   
5. Delete a user can be performed with following HTTP/HTTPS DELETE request:
   - path: /users
   - in querystring: email value should be an email address stored in app
   - in headers: token value should be a valid token( stored and not expired )
   
   The response will contain an HTTP statusCode: 200 OK or an specific error status code(400,401,403,404,500) with an specific              explanation
   
6. Add pizza items from menu to your shopping cart or extend token validity with one hour in plus, or both. This operation or operations    can be performed with the following HTTP/HTTPS PUT request:
   - path: /tokens
   - in querystring: id value should contain an token id
   - in payload should be an array of pizza items which want to buy and/or an boolean true if you want to extend token validity period:
     {
       "id" : "a valid token id",
       "items" : [
                    {
                      "numberOfItems" : x - a positive number greater than zero
                      "itemId" : y - the pizza item id equal to item id from menu.json file
                    },
                    ...
                    and so on
                 ],
       "extend" : true
     }
     
   The response will contain an HTTP statusCode: 200 OK or an specific error status code(400,401,403,404,500) with an specific              explanation
   
7. Get a token info can be performed with the following HTTP/HTTPS GET request:
   - path: /tokens
   - in querystring: id value must be a valid token id
   
   The response will contain an HTTP statusCode: 200 OK or an specific error status code(400,401,403,404,500) and an object depend by      case : 
     on success: an JSON object with all token information
     on error: an JSON object with error explanation
     
8. Delete a token( similar to Sign Out ) can be performed with the following HTTP/HTTPS DELETE request:
   - path: /tokens
   - in querystring: id value must be a valid token id
   
   The response will contain an HTTP statusCode: 200 OK or an specific error status code(400,401,403,404,500) with an specific              explanation
   
9. View the menu can be performed with the following HTTP/HTTPS GET/POST/PUT/DELETE request:
   - path: /menu
   - in headers: token value should be a valid token( stored and not expired )
   
   The response will contain an HTTP statusCode: 200 OK or an specific error status code(400,401,403,404,500) and an object depend by      case : 
     on success: an JSON object array with all pizza items disponible in the menu
     on error: an JSON object with error explanation
     
10. Perform a checkout payment can be performed with the following HTTP/HTTPS GET/POST/PUT/DELETE request:
    - path: /checkout
    - in headers: token value should be a valid token( stored and not expired )
    
    The response will contain an HTTP statusCode: 200 OK or an specific error status code(400,401,403,404,500) with an specific             explanation
    
    !!!After the payment was performed successfuly through Stripe gateway an email is sent to the user through Mailgun, and if email was     sent successfuly the token fileds orederCounter and shoppingCart wil be reseted at default values:
      - orderCounter will be 0(zero)
      - shoppingCart will be [](an empty string)
 
 The menu list is stored in data/menu/menu.json as follows:
  [
	  {
		  "id" : 0,
		  "name" : "piza1",
		  "description" : "description for pizza1",
		  "price" : 30
	  },
	  {
		  "id" : 1,
		  "name" : "piza2",
		  "description" : "description for pizza2",
		  "price" : 45.5
	  },
	  {
		  "id" : 2,
		  "name" : "piza3",
		  "description" : "description for pizza3",
		  "price" : 12
	  }
  ]
  
This application can run in two mode: 
  - staging( using ports 3000 for HTTP and 3001 for HTTPS )
  - production( using ports 5000 for HTTP and 5001 for HTTPS )
  !!! To chose a specific environment please change NODE_ENV value, the default mode used by this application is the staging environment
  
To configure the application you should have:
  1) an api_key for Stripe
  2) an api_key and sanbox domain for Mailgun
  3) Put the Stripe api_key, Mailgun api_key and Mailgun sandbox domain in config.js
  4) create a folder structure as follows in app directory( same directory where is located index.js file):
      data/:
	    - data/menu/
	    - data/tokens/
	    - data/users/
	  
  5) create .json file called menu.json in data/menu directory
  6) put in menu.json the specific content explained up
  
!!! The purpose of this app is only to fulfill the Home Assignement #2 at Node.js Master Class on pirple.com school
