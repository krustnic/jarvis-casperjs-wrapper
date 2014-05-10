/**
* Created with casperjs.
* User: krustnic
* Date: 2014-05-10
* Time: 04:05 PM
* To change this template use Tools | Templates.
*/

//var fs    = require("fs");
var utils = require("utils");

casper.test.begin('Google search retrieves 10 or more results', 5, function suite(test) {
    casper.start('http://www.google.ru/', function() {
        
        Jarvis.log( "buya!" );
        
        this.capture('google.png', {
            top: 100,
            left: 100,
            width: 500,
            height: 400
        });
    });

    casper.run(function() {
        test.done();
    });
});
