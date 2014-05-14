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
    
    this.getScreenResolution = function() {
        return casper.evaluate(function() {
            var D = document;
            return screenResolution = {
                height: Math.max(
                    D.body.scrollHeight, D.documentElement.scrollHeight,
                    D.body.offsetHeight, D.documentElement.offsetHeight,
                    D.body.clientHeight, D.documentElement.clientHeight
                ),
                width: Math.max(
                    D.body.scrollWidth, D.documentElement.scrollWidth,
                    D.body.offsetWidth, D.documentElement.offsetWidth,
                    D.body.clientWidth, D.documentElement.clientWidth
                )
            };
        });
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

/**
 * Original signature: capture(String targetFilepath, [Object clipRect, Object imgOptions])
 * Rewrite "capture" for making screenshots to the proper server location
 **/

casper.capture = Jarvis.wrap( casper.capture, function( f, arguments ) {    
    
    // Default params
    var captureParams = {
        top   : 0,
        left  : 0,
        width : Jarvis.getScreenResolution().width,
        height: Jarvis.getScreenResolution().height
    };
    
    // Merge default params with user-defined, if it exist
    if ( typeof arguments[1] == "object" ) {
        for( var key in arguments[1] ) {
            if ( key == "width" && arguments[1][key]  > Jarvis.getScreenResolution().width  ) continue;
            if ( key == "height" && arguments[1][key] > Jarvis.getScreenResolution().height ) continue;
            captureParams[key] = arguments[1][key];
        }
    }
    
    // We create screenshot with max demension 4000;
    if ( captureParams["width"]  > 4000 ) captureParams["width"]  = 4000;
    if ( captureParams["height"] > 4000 ) captureParams["height"] = 4000;
    

    f.call( casper, Jarvis.getNewScreenshotPath(), captureParams );             
    
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