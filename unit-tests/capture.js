/**
* Created with jarvis-casperjs-wrapper.
* User: krustnic
* Date: 2014-05-14
* Time: 06:23 AM
* To change this template use Tools | Templates.
*/

casper.test.begin('Capture screenshot', 3, function suite(test) {
    test.assertEquals( Jarvis.getNewScreenshotName(), "screen-0.png"   , "getNewScreenshotName" );
    test.assertEquals( Jarvis.getNewScreenshotPath(), "./unit-tests-tmp/screen-1.png" , "getNewScreenshotPath" );
    
    casper.start('http://www.google.ru/', function() {        
        this.capture('google.png', {
            top: 100,
            left: 100,
            width: 500,
            height: 400
        });
        
        test.assert( testfs.exists( "./unit-tests-tmp/screen-2.png" ), "Create screenshot" );
    });
   
    casper.run(function() {
        test.done();
    });
    
});