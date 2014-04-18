describe('eventFilter', function() {

	beforeEach(module('ecoposApp'));

	it('should ...', inject(function($filter) {

        var filter = $filter('eventFilter');

		expect(filter('input')).toEqual('output');

	}));

});