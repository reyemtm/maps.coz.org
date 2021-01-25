var fs = require("fs");

var source = [
  './source/map-layers-config.json'
]

var dest = [
  './public/map-layers-config.json'
]

source.map((f,i) => {
  var file = fs.readFileSync(f);
  var string = JSON.stringify(JSON.parse(file));
  var newString = string.replace(/http:\/\/127.0.0.1:4000/g, 'https://gis.coz.org');
  fs.writeFileSync(dest[i], newString)
})