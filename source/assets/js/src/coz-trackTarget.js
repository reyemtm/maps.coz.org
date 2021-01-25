var geomFN = {};
geomFN.linestring = require('turf-linestring');
geomFN.distance = require("@turf/distance").default;
console.log(geomFN)
var proj4 = require('proj4/dist/proj4');

// TODO [] change color of target background, line and points as the distance changes

function coordRTKtoWGS84 (point) {
  var nad83ITRF00 = "+proj=longLat +ellps=GRS80 +towgs84=-0.9956,1.9013,0.5215,0.025915,0.009246,0.011599,-0.00062 +units=degrees +no_defs";
  var nad83NoTransform = "+proj=longLat +ellps=GRS80 +towgs84=0,0,0 +units=degrees +no_defs";
  
  var pointInNAD83 = proj4(nad83NoTransform,point);
   
  return proj4(nad83ITRF00, 'WGS84', pointInNAD83)
  
 }

function checkLocation() {
  if (!navigator.geolocation) {
    console.log("Geolocation is not supported by this browser.");
    return
  }
}

var watchId;

function trackTarget (map, point) {
  var point = point;
  var map = map;
  getLocation();

  function getLocation () {
    watchId = navigator.geolocation.watchPosition(onLocation, onError,  {
      enableHighAccuracy : true,
      timeout : 4000,
      maximumAge : 500
    });
  }

  function onLocation (position) {
    var coords = position.coords;
    var rtk = false;

    if (coords.accuracy > 10) {
      var alerted = localStorage.getItem('cozAccuracyAlerted') || '';
      if (alerted != 'true') {
        alert("Your accuracy of " + coords.accuracy + " is greater than 10 meters. Results of this tool will be limited. This message will not be shown again.")
       localStorage.setItem('cozAccuracyAlerted','true');
      }
    }else{
      rtk = true
    }

    var gpsPoint = (rtk) ? coordRTKtoWGS84([coords.longitude, coords.latitude]) : [coords.longitude, coords.latitude];

    var lineToTarget = createLine(gpsPoint, point);

    var lineToTargetButton = document.querySelector("#mapTrackingButton")
    lineToTargetButton.children[1].innerHTML = "Distance to target: " + Number((lineToTarget.properties.distance).toFixed(2)).toLocaleString() + "<br>Accuracy (meters): " + Number(coords.accuracy).toLocaleString() + "<br>RTK Fixed: " + (rtk).toString();

    var lineToTargetButtonColor = (lineToTarget.properties.distance < 3) ? "lawngreen" : (lineToTarget.properties.distance < 6) ? "orange" : "salmon" ;

    lineToTargetButton.style.backgroundColor = lineToTargetButtonColor;

    if (!map.getSource("lineToTarget")) {
      map.addSource("lineToTarget", {
        type: "geojson",
        data: lineToTarget
      });
      map.addLayer({
        id: "lineToTarget",
        type: "line",
        source: "lineToTarget",
        paint: {
          "line-color": "yellow",
          "line-width": 4
        }
      })
      map.addLayer({
        id: "lineToTargetMarkers",
        type: "circle",
        source: "lineToTarget",
        paint: {
          "circle-color": "black",
          "circle-opacity": 1,
          "circle-radius": 6,
          "circle-stroke-color": "yellow",
          "circle-stroke-width": 12,
          "circle-stroke-opacity": 0.4
        }
      })
    }else{
      map.getSource("lineToTarget").setData(lineToTarget)
    }

  }

  function onError(error) {
    console.error(error)
  }

}

function createLine (loc, point) {
  var line = geomFN.lineString([
    loc,
    point
  ]);
  var distance = geomFN.distance(loc,point, {units: "feet"});
  line.properties.distance = distance;
  return line
}

function removeTarget (map, id) {
  if (map.getSource("lineToTarget")) {
    var geojson = {
      type: "FeatureCollection",
      features: []
    };
    map.getSource("lineToTarget").setData(geojson);
  }

  console.log("stopping tracking")
  navigator.geolocation.clearWatch(id);
}

function getTarget(button, map) {
  var map = map;
  var button = button;
  map.once("click", function (e) {
    var features = map.queryRenderedFeatures(e.point);
    if (features.length > 0) {
      var points = features.filter(function(f) {
        return (f.layer.type === "circle" || f.layer.type === "symbol")
      });
      if (points.length > 0) {
        var coords = points[0].geometry.coordinates;
        var coordsTrimmed = [Number(coords[0].toFixed(7)),Number(coords[1].toFixed(7))]
        console.log(coordsTrimmed)
        trackTarget(map, coordsTrimmed)
      }else{
        alert("No point features found! Please try again.")
        resetTarget(button, map)
      }
    }else{
      alert("No features found! Please try again.")
      resetTarget(button, map)
    }
  })
}

function resetTarget(button, map) {
  button.classList.remove("tracking")
  button.style.backgroundColor = "white";
  button.children[1].innerHTML = "";
  removeTarget(map, watchId)
}

class target {
  constructor(options) {

    var options = options;

    this.onAdd = function (map) {
      checkLocation();
      this._map = map;
      var map = map;
      this._btn = document.createElement('button');
      this._btn.id = "mapTrackingButton";
      this._btn.type = 'button';
      this._btn['aria-label'] = 'Find Target';
      this._btn.style.width = "auto";
      this._btn.style.minWidth = "36px";
      this._btn.style.height = "auto";
      this._btn.style.minHeight = "37px";
      this._btn.style.borderRadius = "3px"
      this._btn.style.backgroundColor = "white"
      this._img = document.createElement("img");
      this._img.src = "https://icongr.am/clarity/target.svg"
      this._img.style.verticalAlign = "middle";
      this._div = document.createElement("div");
      this._div.style.margin = "0 4px"
      this._btn.appendChild(this._img);
      this._btn.appendChild(this._div)


      this._btn.onclick = function () {
        if (this.classList.contains("tracking")) {
          resetTarget(this, map)
        }else{
          this.classList.add("tracking");
          this.style.backgroundColor = "yellow";
          getTarget(this, map)
        }
      };

      this._container = document.createElement('div');
      this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
      this._container.appendChild(this._btn);
      return this._container;
    };

    this.onRemove = function () {
      this._container.parentNode.removeChild(this._container);
      this._map = undefined;
    };
  }
}

export {
  target
}