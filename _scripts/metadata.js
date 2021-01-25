var fs = require("fs");

var layers = JSON.parse(fs.readFileSync("source/map-layers-config.json"));

layers.forEach(l => {

  l.metadata = {};

  var itemsToAdd = [
    "name",
    "description",
    "group",
    "directory",
    "parent",
    "children",
    "hidden",
    "image",
    "popup",
    "legend",
    "source",
    "sourceType",
    "source-layer"
  ]

  l = addToMetada(l, itemsToAdd)

})

function addToMetada(layer, array) {
  array.forEach(item => {
    if (layer[item]) {
      layer.metadata[item] = layer[item]
      delete layer[item]
    }
  })
  return layer
}

fs.writeFileSync("test.json", JSON.stringify(layers,0,2))