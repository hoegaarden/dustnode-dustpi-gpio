#!/usr/bin/env node

"use strict";

var conf = require('../conf/conf.js')
  , Gpio = require('onoff').Gpio
;

if (require.main === module) {
    if (process.argv.length > 2) {
        var action = process.argv[2];
    
	if (action == 'setup' || action == 'teardown') {
            var sensor = new Gpio(conf.gpio_pin, 'in', 'both');
	    
            if (action == 'teardown')
    		sensor.unexport();
            
            process.exit();
	}
    }
}

function run() {
    var repl_ctx = {};

    repl_ctx.conf = conf;
    setupRepl(conf.socket_path, repl_ctx);
    
    suGPIO('setup', function() {
	var exit_cb = suGPIO.bind(null, 'teardown', function(){
    	    process.exit();
        });
        process.on('SIGINT', exit_cb);
        process.on('SIGTERM', exit_cb);

        var sensor = new Gpio(conf.gpio_pin, 'in', 'both', {persistentWatch:true} );
        repl_ctx.sensor = sensor;
    
        sensor.read(function(err, val) {
    	    if (err)
    		throw err;
    	    
    	    var cur_time = new Date();
    	    var state = {
          	start : cur_time
	      , state : val
              , last_low_edge : cur_time
              , on_low : 0
    	    };
    	    repl_ctx.state = state;
	    
    	    setInterval( function() {
    		return saveSample(state);
    	    }, conf.sample_time * 1000);
    	    
    	    sensor.watch( function(err, val){
    		return stateChanged(err, val, state);
    	    });
        });
    });
}
run();

function suGPIO(mode, cb) {
    var spawn = require('child_process').spawn
      , cmd = 'sudo'
      , args = [ process.execPath, __filename, mode ]
      , opts = { stdio : 'inherit' }
    ;

    var sudo = spawn(cmd, args, opts);
    return sudo.on('exit', function(code){
	if (code != 0) {
	    process.exit(code);
	}
	return cb();
    });
}

function stateChanged(err, val, state) {
    if (err)
        throw err;

    if (val == state.state)
	return;
    
    var cur_time = new Date();
    state.state = val;

    if (val == 1) {
	// up edge
	var dur = cur_time.getTime() - state.last_low_edge.getTime();
	state.on_low = state.on_low + dur;
    } else {
	// down edge
	state.last_low_edge = cur_time;
    }
}

function saveSample(state) {
    if (state.on_low == 0)
	return;

    var low = state.on_low * 1000 // in microseconds
      , start = state.start
      , cur_time = new Date()
    ;

    var sample_dur = cur_time.getTime() - start.getTime()
      , ratio = low / ( sample_dur * 10 )
      , concentration = 1.1 * Math.pow(ratio,3) - 3.8 * Math.pow(ratio,2) + 520 * ratio + 0.62
    ;
    
    sendToDustmap(conf, concentration);

    state.start = cur_time;
    state.on_low = 0;
}


function sendToDustmap(conf, val) {
    var req_opts = conf.url_opts;
    
    if (! req_opts)
	return;

    var data = {
	dustnode_id : conf.station_id
      , dustnode_pass : conf.station_pass
      , dust_density : val
      , time : new Date()
    };

    var body = JSON.stringify(data);

    req_opts.headers = {
	'Content-Type': 'application/json'
      , 'Content-Length': body.length
    };

    var req = require('http').request(req_opts, function(res) {
	if (res.statusCode != 200) {
	    var body = '';

	    res.setEncoding('utf8');	    
	    res.on('data', function(d) {
		body += d;
	    });
	    res.on('end', function() {
		console.log('Error on uploading:', body);
	    });
	}

	// ignore 200
    });
    
    req.on('error', console.log.bind(console));

    req.write(body);
    return req.end();
}


function setupRepl(path, ctx) {
    if (typeof(path) == 'undefined')
	return;

    var net = require('net')
      , repl = require('repl')
    ;

    var srv = net.createServer(function (socket) {
	var keys = Object.keys(ctx);
	
	socket.write("available variables:\n");
	keys.forEach(function(k) {
	    socket.write(" - " + k + "\n");
	});
	socket.write("\n");

	var r = repl.start({
	    prompt: "dust-node> ",
	    input: socket,
	    output: socket
	}).on('exit', function() {
	    socket.end();
	});
	keys.forEach(function(k) {
	    r.context[k] = ctx[k];
	});
    }).listen(path);

    process.on('exit', srv.close.bind(srv));

    return srv;
}