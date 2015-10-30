var pkg = require('./package.json');
var PushpinHandler = require('./lib/pushpin');

var internals = {
    registerFlag: false
};

exports.register = function(server, options, next) {
    if (internals.registerFlag === false) {
        internals.registerFlag = true;
        //do this since hapi does not support websocket-events content type
        server.ext('onRequest', function(request, reply) {
            //set the rel content-type in a new header if needed on the future
            if ('application/websocket-events' === request.headers['content-type']) {
                request.headers['content-type'] = 'text/html';
                request.headers['x-content-type'] = 'application/websocket-events';
            }

            return reply.continue();
        });
    }

    server.route({
        method: 'POST',
        path: options.path,
        handler: function(request, reply) {
            request.plugins[pkg.name].options = {
                pushpinSigKey: options.pushpinSigKey,
                pushpinControlUri: options.pushpinControlUri,
                pushpinMessageCallback: options.callback
            };

            PushpinHandler.post(request, reply);
        }
    });

    next();
};

exports.register.attributes = {
    pkg: require('./package.json'),
    multiple: true
};
