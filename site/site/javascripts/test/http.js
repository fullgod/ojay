YAHOO.util.Event.onDOMReady(function() {
    
    var updater = Ojay('#updater');
    updater.on('click')
            .animate({opacity: {to: 0}}, 0.5)
            ._(Ojay.HTTP).GET('snippet.html').insertInto(updater)
            ._(updater).animate({opacity: {to: 1}}, 0.5);
    
    Ojay('#script-runner').on('click')._(Ojay.HTTP.GET, 'script.html').evalScripts();
    
    Ojay('#on200').on('click')._(Ojay.HTTP.GET, 'script.html?foo=bar', {ajaxLayout: true}, {
        on200: function(response) {
            response.evalScripts();
        }
    });
    
    Ojay('#not-found').on('click')._(Ojay.HTTP.GET, '404.html', {}, {
        onFailure: function() {
            alert('Page not found');
        },
        onComplete: function() {
            alert('Completed');
        },
        on404: function() {
            alert('404');
        }
    });
    
    Ojay('input[type=submit]').on('click', function(el, e) { YAHOO.util.Event.preventDefault(e) })
        ._(Ojay.HTTP.GET, '/index.html', {
            width: Ojay('#on200').method('getWidth')
        })
        .insertInto('#message');
    
    Ojay('#get-util').on('click', function() {
        Ojay.HTTP.load('/service/json.html?jsonp=callback', {}, {
            onSuccess: function(){}.traced()
        });
        Ojay.HTTP.GET('/service/json.html')._(function() { alert(this.responseText); });
    });
    
    Ojay('#post-util').on('click', function() {
        (Ojay.HTTP).POST('http://json.jcoglan.com', {
            callback: 'foo',
            message: 'something'
        });
        Ojay('iframe[name=__ojay_cross_domain__]').show();
    });
});

var TestCase = {
    notify: function(json) {
        alert(json.message);
    }
};

Ojay.HTTP.on('request', function(){}.traced())._(function() {
    window.console && console.log(this.uri)
});
Ojay.HTTP.on(200, function() {
    window.console && console.log(200);
}.traced());

YAHOO.util.Event.onDOMReady(function() {
    YAHOO.tool.TestRunner.add(new YAHOO.tool.TestCase({
        name: 'URI parser tests',
        
        setUp: function() {
            this.assert = YAHOO.util.Assert;
            this.arrayAssert = YAHOO.util.ArrayAssert;
            this.localProtocol = window.location.protocol.replace(/\W/g, '');
            this.localHost = window.location.hostname;
            this.localPort = window.location.port;
        },
        
        testDomainsAndPorts: function() {
            var uri = 'http://ojay.othermedia.org'.parseURI();
            this.assert.areEqual('http', uri.protocol);
            this.assert.areEqual('ojay.othermedia.org', uri.domain);
            this.assert.areEqual('80', uri.port);
            this.assert.areEqual('', uri.path);
            
            uri = 'https://ojay.othermedia.org:80'.parseURI();
            this.assert.areEqual('https', uri.protocol);
            this.assert.areEqual('80', uri.port);
            
            uri = 'https://ojay.othermedia.org'.parseURI();
            this.assert.areEqual('https', uri.protocol);
            this.assert.areEqual('443', uri.port);
            
            this.assert.areEqual('https://ojay.othermedia.org', 'https://ojay.othermedia.org:443'.parseURI().toString());
            this.assert.areEqual('http://ojay.othermedia.org/', 'http://ojay.othermedia.org:80/'.parseURI().toString());
            this.assert.areEqual('http://ojay.othermedia.org:3030/', 'http://ojay.othermedia.org:3030/'.parseURI().toString());
            
            this.assert.areEqual('http://localhost:' + this.localPort + '/path.html', 'http://localhost/path.html'.parseURI().toString());
        },
        
        testCrossDomainDetection: function() {
            var uri = this.localProtocol + '://' + this.localHost;
            this.assert.isTrue(uri.parseURI().isLocal());
            
            uri = this.localProtocol + '://' + this.localHost + ':' + this.localPort;
            this.assert.isTrue(uri.parseURI().isLocal());
            
            uri = this.localProtocol + '://' + this.localHost + ':443';
            this.assert.isFalse(uri.parseURI().isLocal());
            
            uri = 'https://' + this.localHost + ':' + this.localPort;
            this.assert.isFalse(uri.parseURI().isLocal());
            
            uri = this.localProtocol + '://' + 'ojay.othermedia.org' + ':' + this.localPort;
            this.assert.isFalse(uri.parseURI().isLocal());
        },
        
        testPathOnly: function() {
            var local = this.localProtocol + '://' + this.localHost + ':' + this.localPort, uri = 'ojay.othermedia.org'.parseURI();
            this.assert.areEqual(this.localProtocol, uri.protocol);
            this.assert.areEqual(this.localPort, uri.port);
            this.assert.areEqual(local + '/test/ojay.othermedia.org', 'ojay.othermedia.org'.parseURI().toString());
            this.assert.areEqual(local + '/test/path/to/something.html', 'path/to/something.html'.parseURI().toString());
            this.assert.areEqual(local + '/path/to/something.html', '/path/to/something.html'.parseURI().toString());
            this.assert.areEqual(local + '/test/', ''.parseURI().toString());
            this.assert.areEqual(local + '/', '/'.parseURI().toString());
        },
        
        testQueryStrings: function() {
            var local = this.localProtocol + '://' + this.localHost + ':' + this.localPort;
            this.assert.isTrue('/path/?foo=bar&something=else'.equalsURI('/path/?something=else&foo=bar'));
            this.assert.isTrue('/path/?foo=bar&something=else'.equalsURI(local + '/path/?something=else&foo=bar'));
            this.assert.isFalse('/path/?something=else'.equalsURI('/path/?something=else&foo=bar'));
            this.assert.isFalse('/path/?foo=k&something=else'.equalsURI('/path/?something=else&foo=bar'));
            this.assert.areEqual('something else', '/foo?q=something+else'.parseURI().params.q);
        },
        
        testToString: function() {
            var local = this.localProtocol + '://' + this.localHost + ':' + this.localPort;
            this.assert.areEqual(local + '/path.html?a=b&c=d&e=f', '/path.html?e=f&a=b&c=d'.parseURI().toString());
            this.assert.areEqual(local + '/path.html?a=b&c=%2F%2F%3F%2F%2F%3F%2F%2F%2F%2F%2F&e=f', '/path.html?e=f&a=b&c=//?//?/////'.parseURI().toString());
        },
        
        testHash: function() {
            var uri = Ojay.URI.parse('http://localhost:8080/#photos=gallery_null');
            this.assert.areEqual('http', uri.protocol);
            this.assert.areEqual('localhost', uri.domain);
            this.assert.areEqual('8080', uri.port);
            this.assert.areEqual('/', uri.path);
            this.assert.areEqual('photos=gallery_null', uri.hash);
            
            uri = Ojay.URI.parse('/some-sort-of/page/with_no/query.html.js#foo=bar');
            this.assert.areEqual('/some-sort-of/page/with_no/query.html.js', uri.path);
            this.assert.areEqual('foo=bar', uri.hash);
            
            uri = Ojay.URI.parse('/a-page/with/query?myKey=__myValue__#foo=bar');
            this.assert.areEqual('/a-page/with/query', uri.path);
            this.assert.areEqual('foo=bar', uri.hash);
            this.assert.areEqual('__myValue__', uri.params.myKey);
            var keys = 0;
            for (var key in uri.params) keys++;
            this.assert.areEqual(1, keys);
        }
    }));
    
    var logger = new YAHOO.tool.TestLogger();
    YAHOO.tool.TestRunner.run();
});
