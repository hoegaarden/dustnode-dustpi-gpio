
module.exports = {
    gpio_pin : 4
  , sample_time: 60
  , station_id: 2
  , station_pass: 'herrbert'
  , socket_path: '/tmp/dust.sock'
  // , file_opts : {
  //     path : __dirname + "/../data/sensor.csv"
  //   , format : 'csv'
  // }
  , url_opts : {
      hostname : 'monitor.zobl.at'
    , port: 3000
    , method: 'POST'
    , path : '/dustnet/insert/'
  }
};
