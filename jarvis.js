/**
* Created with casperjs.
* User: krustnic
* Date: 2014-05-10
* Time: 03:48 PM
* To change this template use Tools | Templates.
*/

var Jarvis = new (function() {
    var self = this;
    
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

/**
 * Rewrite "capture" for making screenshots to the proper server location
 **/

casper.capture = Jarvis.wrap( casper.capture, function( f, arguments ) {
    f.call( casper, "screen-3.png" );
    // var userFilePath = arguments[0] 
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