const fs = require("fs");

const layers = JSON.parse(fs.readFileSync("./source/map-layers-config.json.bak"))

layers.forEach(l => {

  if (!l.metadata) {
    l.metadata = {};
    l.metadata.popup = true
  }else{
    
    console.log(l.id, l.metadata)
  }
})

fs.writeFileSync("./source/map-layers-config_new.json", JSON.stringify(layers, 0,2))