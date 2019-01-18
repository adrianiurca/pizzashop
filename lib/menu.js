/*
* Menu-related tasks
*
*/

// Dependencies
var _data = require('./data');

// Container
var menu = {};

menu.list = function(callback) {
	_data.read('menu','menu',function(err,items) {
		console.log(items);
		if(!err && items) {
			callback(false,items);
		} else {
			callback(true,false);
		}
	});
};

// Export the module
module.exports = menu;