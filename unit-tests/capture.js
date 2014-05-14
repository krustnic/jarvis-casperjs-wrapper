/**
* Created with jarvis-casperjs-wrapper.
* User: krustnic
* Date: 2014-05-14
* Time: 06:23 AM
* To change this template use Tools | Templates.
*/

casper.test.begin('Capture screenshot', 5, function suite(test) {
    test.assertEquals( Jarvis.getNewScreenshotName(), "screen-0.png"   , "getNewScreenshotName" );
    test.assertEquals( Jarvis.getNewScreenshotPath(), "./unit-tests-tmp/screen-1.png" , "getNewScreenshotPath" );
    
    casper.start('http://www.google.ru/', function() {        
        this.capture('google.png');
        
        test.assert( testfs.exists( "./unit-tests-tmp/screen-2.png" ), "capture 1 param" );
        
        this.capture('google.png', {
            top: 0,
            left: 0,
            width: 4000,
            height: 4000
        });
        
        test.assert( testfs.exists( "./unit-tests-tmp/screen-3.png" ), "capture 2 param" );
        
        this.capture('google.png', {
            top: 100,
            left: 100,
            width: 500,
            height: 400
        }, {
            format: 'jpg',
            quality: 1
        });
        
        test.assert( testfs.exists( "./unit-tests-tmp/screen-3.png" ), "capture 3 param" );
    });
   
    casper.run(function() {
        test.done();
    });
    
});