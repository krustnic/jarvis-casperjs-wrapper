/**
* Created with jarvis-casperjs-wrapper.
* User: krustnic
* Date: 2014-05-15
* Time: 02:27 PM
* To change this template use Tools | Templates.
*/

casper.test.begin('require wrapping', 1, function suite(test) {
    casper.start();
    casper.then(function() {    
        test.assertEqual( require("fs"), null, "require 'fs' module" );        
    });    
    
    casper.run(function() {
        test.done();
    });
});