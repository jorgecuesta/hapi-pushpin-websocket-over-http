var pkg = require('../package.json');
var pubcontrol = require('pubcontrol');
var grip = require('grip');
var Boom = require('boom');

//subscribe/unsubscribe format
// {"c": {"type":"subscribe/unsubscribe", "channel":"test"}}

//message format
//{"m": {"content":"My message", "channel":"test"}}
exports.post = function(request, reply) {
    pluginOpts = request.plugins[pkg.name].options;
    // Validate the Grip-Sig header:
    //value is the sig-key config in pushpin config file
    if (!grip.validateSig(request.headers['grip-sig'], pluginOpts.pushpinSigKey)) {
        reply(Boom.badRequest('Invalid Grip-Sig header.'));
        return;
    }

    var inEvents = grip.decodeWebSocketEvents(request.payload);
    var outEvents = [],
        body;

    if (inEvents[0].getType() == 'OPEN') {
        // Open the WebSocket:
        outEvents.push(new grip.WebSocketEvent('OPEN'));
    } else if (inEvents[0].getType() == 'TEXT') {
        body = inEvents[0].getContent();
        body = JSON.parse(body);

        // control message
        if (body.hasOwnProperty('c')) {
            message = grip.webSocketControlMessage(body.c.type, {
                'channel': body.c.channel
            });
            outEvents.push(new grip.WebSocketEvent('TEXT', 'c:' + message));
        } else if (body.hasOwnProperty('m')) {
            // normal message
            pluginOpts.pushpinMessageCallback(body.m.channel, body.m.content,
                pluginOpts.pushpinControlUri);
        }
    }

    var reponse = reply(grip.encodeWebSocketEvents(outEvents));

    reponse.header('Sec-WebSocket-Extensions', 'grip; message-prefix=""');
    reponse.type('application/websocket-events');
};
