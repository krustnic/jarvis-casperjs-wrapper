/**
* Created with casperjs.
* User: krustnic
* Date: 2014-05-10
* Time: 03:48 PM
* To change this template use Tools | Templates.
*/

/**
 * NOTE! It is not a NodeJS environment - its PhantomJS
 * So it's a Phantom's modules like "fs"
 * https://github.com/ariya/phantomjs/wiki/API-Reference-FileSystem
 * */

var Jarvis = new (function() {
    var self = this;
    
    this.BASE_DIR         = casper.cli.raw.get("base-dir") || ".";
    this.USER_CONFIG_FILE = casper.cli.raw.get("config-file");
    
    this.SCREENSHOT_PREFIX = "screen";
    this.SCREENSHOT_EXT    = "png";
    this._screenShotCount  = 0;
    
    // Config default values
    // Actual values will be result of merge with file data
    this.config = {
        "RUNNER_ID" : "1"
    };
    
    this.loadConfigFile = function() {
        // By default load jarvis-config.json
        // If it specified load user defined (cli param "config-file") 
        // filePath is relative to the BASE_DIR param
        
        var configFilePath = self.USER_CONFIG_FILE || "jarvis-config.json";
        
        // Create local scope for fs module (PhantomJS)
        var fs = require("fs");
        
        var rawConfig = fs.read( self.BASE_DIR + "/" + configFilePath );   
        var configObj = JSON.parse( rawConfig );
        
        // merge with defualt values
        for( var key in configObj ) {
            self.config[key] = configObj[key];
        }
        
    }
        
    this.getNewScreenshotName  = function() {
        var newName = self.SCREENSHOT_PREFIX + "-" + self._screenShotCount + "." + self.SCREENSHOT_EXT;
        self._screenShotCount += 1;
        
        return newName;
    }
    
    this.getNewScreenshotPath = function() {
        return self.BASE_DIR + "/" + self.getNewScreenshotName();
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
    
    this.init = function() {
        this.loadConfigFile();
    }
    
    this.init();
    
    
})();

// For unit tests purpose
if ( typeof exports != "undefined" ) exports.Jarvis = Jarvis;
//

/**
 * Original signature: capture(String targetFilepath, [Object clipRect, Object imgOptions])
 * Rewrite "capture" for making screenshots to the proper server location
 **/

casper.capture = Jarvis.wrap( casper.capture, function( f, arguments ) {
    
    // Only fileName
    if ( arguments.length == 1 ) {
        f.call( casper, Jarvis.getNewScreenshotPath() );            
        return;
    }
    
    // Filename and clipRect
    if ( arguments.length == 2 ) {
        f.call( casper, Jarvis.getNewScreenshotPath(), arguments[1] );            
        return;
    }
    
    // Filename, clipRect and imgOptions
    // Ignoring third imgOptions - always create PNG image
    if ( arguments.length == 3 ) {
        f.call( casper, Jarvis.getNewScreenshotPath(), arguments[1] );            
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