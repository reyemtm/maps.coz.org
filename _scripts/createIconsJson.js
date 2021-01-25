const fs = require("fs");
// const svgexport = require("svgexport");

const directory = "./source/assets/symbols/nps"
const icons = fs.readdirSync(directory);

const iconsObject = []
const svgObject = [];

icons.forEach(icon => {
  const png = icon.replace("svg", "png")
  iconsObject.push({
    name: icon.replace(".svg", ""),
    url: "/assets/symbols/nps/" + png
  });

  // svgObject.push({
  //   input: directory + icon,
  //   output: "static/assets/mapillary-icons/" + png
  // })
})
fs.writeFileSync("./source/assets/symbols/nps-icons.json", JSON.stringify(iconsObject,0,2))

// svgexport.render(svgObject, function(e) {
//   console.log(e);
//   fs.writeFileSync("static/assets/mapillary-icons/mapillary-icons.json", JSON.stringify(iconsObject,0,2))
// })