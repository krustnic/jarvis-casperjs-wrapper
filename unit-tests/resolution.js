/**
* Created with jarvis-casperjs-wrapper.
* User: krustnic
* Date: 2014-05-14
* Time: 09:50 AM
* To change this template use Tools | Templates.
*/

casper.test.begin('Screen resolution', 2, function suite(test) {
    casper.start();
    casper.then(function() {
        casper.viewport( 1280, 1024 );
        test.assertEqual( 1280, Jarvis.getScreenResolution().width );
        test.assertEqual( 1024, Jarvis.getScreenResolution().height );        
    });    
    
    casper.run(function() {
        test.done();
    });
});