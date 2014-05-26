casper.test.begin( '404 Page status test', 0 , function suite(test) {
    casper.start();
    casper.then(function () {
            casper.open('http://habrahabr.ru/post/unknownResourse/', function() {});
    });
    casper.then(function() {
          casper.test.assert(Jarvis.httpStatusLog.length == 1);
      });
    casper.run(function() {
        test.done();
    });
});