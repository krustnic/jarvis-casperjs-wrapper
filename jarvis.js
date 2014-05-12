/**
* Created with casperjs.
* User: krustnic
* Date: 2014-05-10
* Time: 03:48 PM
* To change this template use Tools | Templates.
*/

var Jarvis = new (function() {
    var self = this;
    
    this.SCREENSHOT_PREFIX = "screen";
    this.SCREENSHOT_EXT    = "png";
    this._screenShotCount  = 0;
        
    this.getNewScreenshotName  = function() {
        var newName = self.SCREENSHOT_PREFIX + "-" + self._screenShotCount + "." + self.SCREENSHOT_EXT;
        self._screenShotCount += 1;
        
        return newName;
    }
    
    this.wrap = function( target, wrapFunction ) {
        var f = target;
        return function() {
            wrapFunction( f, arguments );            
        };
    }
    
    this.log = function( msg ) {
        console.log("Jarvis: ", msg);
    }
})();

// For unit tests purpose
if ( typeof exports != "undefined" ) exports.Jarvis = Jarvis;
var casper = casper || {};
//

/**
 * Original signature: capture(String targetFilepath, [Object clipRect, Object imgOptions])
 * Rewrite "capture" for making screenshots to the proper server location
 **/

casper.capture = Jarvis.wrap( casper.capture, function( f, arguments ) {
    
    // Only fileName
    if ( arguments.length == 1 ) {
        f.call( casper, Jarvis.getNewScreenshotName() );            
        return;
    }
    
    // Filename and clipRect
    if ( arguments.length == 2 ) {
        f.call( casper, Jarvis.getNewScreenshotName(), arguments[1] );            
        return;
    }
    
    // Filename, clipRect and imgOptions
    // Ignoring third imgOptions - always create PNG image
    if ( arguments.length == 3 ) {
        f.call( casper, Jarvis.getNewScreenshotName(), arguments[1] );            
        return;
    }
    
    
    f.call( casper, Jarvis.getNewScreenshotName() );    
    
});

/**
 * Disallow user script access to some modules (e.g. "fs")  
 **/

require = Jarvis.wrap( require, function( f, arguments ) {
    
    var disallow = {
        "fs" : ""
    }
    
    if ( arguments[0] in disallow ) {
        console.log("Sorry. You have no access to Filesystem.");
        casper.exit();
        return;
    }
    
    f.apply( this, arguments );
}); 