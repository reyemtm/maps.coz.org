const fs = require("fs");
const fetch = require("node-fetch")

class App {
  constructor (e) {
    this.title = e.title;
    this.subtitle = (!e.subtitle) ? "" : e.subtitle;
    this.description = (!e.description) ? "" : e.description;
    this.origin = e.origin;
    this.url = (e.origin === "hexo") ? "https://gis.coz.org" + e.url.replace("/", "") : e.url;
    this.categories = e.categories;
    this.views = (!e.numViews) ? "" : e.numViews
    this.type = e.type;
  }
}

async function getApps() {
  const hexoApps = JSON.parse(fs.readFileSync("./public/search.json"));

  const agolFeed = await fetch("https://zanesville.maps.arcgis.com/sharing/rest/search/?f=json&num=1000&q=orgid:IUhP9plEzDTayUVC");
  const agolResults = await agolFeed.json();
  const agolApps = agolResults.results

  return {hexoApps, agolApps}

}

getApps().then(apps => {

  const applications = [];

  apps.hexoApps.map(a => {
    a.origin = "hexo";
    a.type = (!a.categories) ? "" : a.categories[0] === "app" ? "Web App" : "Web Map";
    if (a.title) applications.push(new App(a))
  });

  apps.agolApps.map(a => {
    a.origin = "agol";
    a.categories = [...a.categories, ...a.tags];
    applications.push(new App(a))
  });
  
  fs.writeFileSync("./public/apps-public-raw.json", JSON.stringify(apps, 0, 2))
  fs.writeFileSync("./public/apps-public.json", JSON.stringify(applications, 0, 2))
})

