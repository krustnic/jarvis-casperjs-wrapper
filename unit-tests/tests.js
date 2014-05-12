/**
* Created with jarvis-casperjs-wrapper.
* User: krustnic
* Date: 2014-05-12
* Time: 05:50 PM
* To change this template use Tools | Templates.
*/

// Repo: https://github.com/caolan/nodeunit/

exports["getNewScreenshotName"] = function(test){
    var Jarvis = require("../jarvis.js").Jarvis;
    
    test.expect(3);
    test.equal( Jarvis.getNewScreenshotName(), "screen-0.png");
    test.equal( Jarvis.getNewScreenshotName(), "screen-1.png");
    test.equal( Jarvis.getNewScreenshotName(), "screen-2.png");
    test.done();
};
