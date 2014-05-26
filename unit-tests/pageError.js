  casper.test.begin('pageError', 1, function suite(test) {
      casper.start();
      casper.userAgent('Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.131 Safari/537.36');
      casper.viewport(1280, 1024);
      casper.then(function() {
          casper.open('http://www.eltech.ru/ru/abiturientam/priyom-na-1-y-kurs', function() {});
      });
      casper.thenEvaluate(function(term) {
          document.querySelector('input[name="q"]').setAttribute('value', term);
          document.querySelector('form[name="f"]').submit();
      }, 'Chuck Norris');
      casper.then(function() {
          casper.test.assert(Jarvis.pageLog.length == 1);
      });
      casper.run(function() {
          test.done();
      });
  });