// 2.108 SECONDS WITH 3537 FEATURES
// JavaScript toFixed() is very slow

// import * as turf from "@turf/helpers"

var workerMasterNetwork = {
  type: "FeatureCollection",
  features: []
}

var workerIds = [];

var networkTree = {
  type: "FeatureCollection",
  name: "networkTree",
  features: []
}

var netowrkTimeCheck = Date.now();

self.addEventListener('message', function(e) {
  // LOG ANY MESSAGES FOR DEBUGGING
  // this.console.log(e)

  if (e.data.features && e.data.name === "network") {
    workerMasterNetwork.features = (e.data.features).slice();

    var linestring = {
      type: "FeatureCollection",
      features: []
    };

    workerMasterNetwork.features.map(feature => {
      if (feature.geometry.coordinates[0][0].length) {
        feature.geometry.coordinates.map(line => {
          linestring.features.push({
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: geojsonPrecision(line,8)
            }
          })
        })
      }else{
        linestring.features.push(geojsonPrecision(feature,8))
      }
    })
    workerMasterNetwork.features = (linestring.features).slice();
    // console.log(workerMasterNetwork)

    var geometryTypeCheck = true;

    //CHECKING THAT THE CONVERSION WORKED
    workerMasterNetwork.features.reduce((i,f) => {
      if (f.geometry.type != "LineString") error = true;
      return [...i, f.geometry.type]
    },[]);

    if (geometryTypeCheck) {
      console.log("all geometries are linestrings, the tool should work")
    }else{
      console.warn("all geometries are not linestrings, the tool may break");
      alert("all geometries are not linestrings, the tool may break")
    }

    this.console.log("worker added", workerMasterNetwork.features.length, "features to the master linear network ")
  }

  if (!e.data.features && e.data.geometry && e.data.geometry.type === "Point") {

    // GRAB CURRENT TIME TO CHECK DURATION OF NETWORK TRACE
    netowrkTimeCheck = Date.now();

    // RESET NETWORK TREE & WORKER IDS
    networkTree.features = [];

    workerIds = new Array(workerMasterNetwork.features.length)

    var featureCollection = networkLines(e.data, workerMasterNetwork)

    networkTree.features = featureCollection.features.slice(0)

    networkBuild(featureCollection, workerMasterNetwork, e.data.name)

  }

}, false);


function networkLines(point, network, string) {
  var point = point;
  var a = point.geometry.coordinates
  let direction = (!string) ? point.name : string;
  var networkSeed = [];
  for (var i = 0; i < network.features.length; i++) {

    if (workerIds[i]) {
      continue
    }

    var f = network.features[i];

    //TEST REPLACEMENT FOR POINT ON LINE
    var pointInLineVertices = false;
    f.geometry.coordinates.map(c => {
      if (a[0] == c[0] && a[1] == c[1]) pointInLineVertices = true
    })

    if (pointInLineVertices) {
    // if (turf.booleanPointOnLine(point, f)) {
      var d = (direction === "upstream") ? 0 : f.geometry.coordinates.length - 1;
      var b = f.geometry.coordinates[d];
      if ( (a[0].toFixed(6) != b[0].toFixed(6)) || (a[1].toFixed(6) != b[1].toFixed(6)) ) {
        workerIds[i] = 1;
        networkSeed.push(f)
      }
    }
  };

  return {
    type: "FeatureCollection",
    features: networkSeed
  }

}

function networkBuild(lines, network, string) {
  let direction = string;
  // GET ALL UPSTREAM POINTS
  var networkPoints = [];

  lines.features.map(function (f) {
    var netowrkDirection = (direction === "upstream") ? 0 : f.geometry.coordinates.length - 1;
    networkPoints.push(f.geometry.coordinates[netowrkDirection]);
  });

  var tempFeatures = {
    type: "FeatureCollection",
    features: []
  };

  // GET NETWORK LINES FROM THESE POINTS
  for (let p = 0; p < networkPoints.length; p++) {
    var point = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Point",
        coordinates: networkPoints[p]
      }
    };
    var tempFeatures02 = networkLines(point, network, direction);
    tempFeatures02.features.map(f => {
      tempFeatures.features.push(f);
      networkTree.features.push(f)
    });
  }
  if (tempFeatures.features.length > 0) {
    networkBuild(tempFeatures, network, direction);
  }else{
    console.log("worker network trace took", Date.now() - netowrkTimeCheck, "ms", "\n networkTree has ", networkTree.features.length, "features")
    self.postMessage(networkTree)
  }
}

function geojsonPrecision(t, coordinatePrecision, extrasPrecision) {

  function point(p) {
    return p.map(function (e, index) {
      if (index < 2) {
        return 1 * e.toFixed(coordinatePrecision);
      } else {
        return 1 * e.toFixed(extrasPrecision);
      }
    });
  }

  function multi(l) {
    return l.map(point);
  }

  function poly(p) {
    return p.map(multi);
  }

  function multiPoly(m) {
    return m.map(poly);
  }

  function geometry(obj) {
    if (!obj) {
      return {};
    }

    switch (obj.type) {
      case "Point":
        obj.coordinates = point(obj.coordinates);
        return obj;
      case "LineString":
      case "MultiPoint":
        obj.coordinates = multi(obj.coordinates);
        return obj;
      case "Polygon":
      case "MultiLineString":
        obj.coordinates = poly(obj.coordinates);
        return obj;
      case "MultiPolygon":
        obj.coordinates = multiPoly(obj.coordinates);
        return obj;
      case "GeometryCollection":
        obj.geometries = obj.geometries.map(geometry);
        return obj;
      default:
        return {};
    }
  }

  function feature(obj) {
    obj.geometry = geometry(obj.geometry);
    return obj
  }

  function featureCollection(f) {
    f.features = f.features.map(feature);
    return f;
  }

  function geometryCollection(g) {
    g.geometries = g.geometries.map(geometry);
    return g;
  }

  if (!t) {
    return t;
  }

  switch (t.type) {
    case "Feature":
      return feature(t);
    case "GeometryCollection":
      return geometryCollection(t);
    case "FeatureCollection":
      return featureCollection(t);
    case "Point":
    case "LineString":
    case "Polygon":
    case "MultiPoint":
    case "MultiPolygon":
    case "MultiLineString":
      return geometry(t);
    default:
      return t;
  }

}