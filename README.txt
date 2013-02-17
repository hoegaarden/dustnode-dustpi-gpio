dustnode-dustpi-gpio
====================

This is a daemon, which reads values from the dust sensor[1] and sends
the collected data home to the dustmap-server[2].

It was coded and tested on a raspberry-pi (hence the name dustpi) but
schould run on any linux system which has GPIO-ports[3] and can run
node.js[4].

Installation
------------

pi@dust-pi ~ $ git clone https://github.com/hoegaarden/dustnode-dustpi-gpio.git
pi@dust-pi ~ $ cd dustnode-dustpi-gpio
pi@dust-pi ~/dustnode-dustpi-gpio $ npm install
pi@dust-pi ~/dustnode-dustpi-gpio $ sudo ln -s `pwd`/extra/init.sh /etc/init.d/dustnode
pi@dust-pi ~/dustnode-dustpi-gpio $ sudo update-rc.d dustnode defaults
pi@dust-pi ~/dustnode-dustpi-gpio $ sudo cp extra/sudoers /etc/sudoers
pi@dust-pi ~/dustnode-dustpi-gpio $ sudo /etc/init.d/dustnode start

Priviliges
----------

In the default configuration the daemon runs as nobody:nogroup. The
setup and teardown of the GPIO-port needs superuser priviliges. So for
those two cases the daemon calls itself via sudo to get the permission
to setup the port at the beginning and free all resources again at the
end. Hence the sudoers stuff ... 

You can change the user/group which runs the daemon either in the
init-script or in /etc/default/dustnode. 

Configuration
-------------

The configuration is should be a node-module exporting an object. By
now following keys get evaluated:

'gpio_pin'
    to which GPIO-pin the dust sensor is connected
'sample_time'
    the time (in seconds) we listen to the sensor and then calculate
    the particel conentration for
'station_id'
    identifier for this station - go ask anybody at dustmap and you'll
    get an id
'station_pass'
    doesn't really do anything by now but should be coming soon
'socket_path'
    if defined, the daemon tries to create an unix socket and attaches
    a repl to it - you can connect via "netcat -U <socket_path>" and
    inspect some internals of the daemon (mostly for debugging ...)
'url_opts'
    options for http.request[5] - where to send the data to

Bugs
----

This is the first demo. There are many bugs and no tests. Hopefully
this changes soon ...

TODO
----

(in no special order ...)
- error checking / handling
- test
- split into modules
- write better documentation
- write hardware documentation
- better setup-/teardown handling (read: no mo' hacks)
- ...


[1] Shinyei particle sensor PPD42 - http://www.sca-shinyei.com/particlesensor
[2] http://dustmap.org/
[3] http://en.wikipedia.org/wiki/General_Purpose_Input/Output
[4] http://nodejs.org/
[5] http://nodejs.org/api/http.html#http_http_request_options_callback

