/**
* Created with jarvis-casperjs-wrapper.
* User: krustnic
* Date: 2014-05-15
* Time: 06:04 PM
* To change this template use Tools | Templates.
*/

casper.test.begin('Assert eval', 1, function suite(test) {
    casper.start();
    casper.then(function() {
        var assertResult = test.assertEval(function () {
            return true;
        }, 'name of assert');
    });    
    
    casper.run(function() {
        test.done();
    });
});
