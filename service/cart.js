angular.module('ecoposApp').factory('cart',function() {

	var cart = {};

	var invoice = {
		items: {}
	};

	return {

		cart: cart,
		invoice: invoice
	};
});