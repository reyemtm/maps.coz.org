import {getQuery} from "./coz-helpers.js";
import {getLayers} from "./coz-helpers.js";
import {hasLayer} from "./coz-helpers.js";
// import {compile} from "handlebars";

// TODO ACCOUNT FOR GEOJSON TYPE
// TODO MAKE SEPARATE HIGHLIGHT AND CLICK FUNCTIONS

var highlightState = {
  "click": {
    id: 0,
    layer: "",
    source: "",
    sourceLayer: ""
  },
  "highlight": {
    id: 0,
    layer: "",
    source: "",
    sourceLayer: ""
  }
}

/**
 * 
 * @param {*} map 
 * @param {*} feature 
 * @param {*} highlightOnly 
 */
function highlightAddFeature(map, feature, highlightOnly) {
  // console.log(feature)
  var highlightMap = map;
  var highlightType = (!highlightOnly) ? "click" : "highlight";

  var highlightStateType = {
    "click": {
      "click": true
    },
    "highlight": {
      "highlight": true
    }
  }
  if (!feature.id && feature.id != 0) {
    console.warn("no feature id, highlight error")
    return
  }

  highlightClearFeature(highlightMap, highlightType)
  
  var clone = [feature.layer].slice();
  var highlightLayer = clone[0]

  var height = (highlightLayer.type === "fill-extrusion") ? highlightLayer.paint["fill-extrusion-height"] : 0;

  highlightLayer.id = "cozHighlight_" + (highlightLayer.id).replace("cozHighlight_", "");

  highlightLayer.type = (highlightLayer.type === "fill" || highlightLayer.type === "line") ? "line" : (highlightLayer.type === "fill-extrusion") ? "fill": "circle";

  highlightLayer.paint = (!height) ? highlightLayerPaint(highlightLayer.type) : highlightLayerPaint(highlightLayer.type, highlightLayer.paint["fill-extrusion-color"])

  if (highlightLayer.type === "fill-extrusion") {
    highlightLayer.paint["fill-extrusion-height"] = height
  }

  highlightLayer.layout = {
    "visibility": "none"
  };

  if (!hasLayer(highlightMap, highlightLayer.id)) {
    console.log("adding highlight layer", highlightLayer.id)
    map.addLayer(highlightLayer);
  }

  highlightState[highlightType].id = feature.id;
  highlightState[highlightType].layer = highlightLayer.id;
  highlightState[highlightType].source = highlightLayer.source;
  highlightState[highlightType].sourceLayer = highlightLayer["source-layer"];

  map.setFeatureState({source: highlightLayer.source, sourceLayer: highlightLayer["source-layer"], id: feature.id}, highlightStateType[highlightType]);
  map.setLayoutProperty(highlightLayer.id, "visibility", "visible");

}

/**
 * 
 * @param {*} e 
 */
function highlightClearFeature(e, type, noFeatures) {
  var type = (!type) ? "click" : type;
  if (noFeatures) {
    //GET RID OF POPUP WINDOW ON CLICK HIGHLIGHT
    if (document.getElementById("map--info-window")) {
      document.getElementById("map--info-window").style.display = "none";
    }
  }

  var layers = getLayers(e);
  if (layers.indexOf(highlightState[type].layer) > -1) {
    if (type === "highlight") {
      e.setFeatureState({source: highlightState[type].source, sourceLayer: highlightState[type].sourceLayer, id: highlightState[type].id}, {highlight: false});
      var click = e.getFeatureState({source: highlightState[type].source, sourceLayer: highlightState[type].sourceLayer, id: highlightState[type].id});
      if (!click.click) e.setLayoutProperty(highlightState[type].layer, "visibility", "none");
    }else{
      e.setFeatureState({source: highlightState[type].source, sourceLayer: highlightState[type].sourceLayer, id: highlightState[type].id}, {click: false});
      e.setLayoutProperty(highlightState[type].layer, "visibility", "none");

      //GET RID OF POPUP WINDOW ON CLICK HIGHLIGHT
      if (document.getElementById("map--info-window")) {
        document.getElementById("map--info-window").style.display = "none";
      }

    }
  }
}

/**
 * 
 * @param {*} type 
 */
function highlightLayerPaint(featureType, color) {
  if (color) {
    color = "rgba(" + color.r * 1000 + "," + color.g * 1000 + "," + color.b * 1000 + "," +  0.5 + ")"
  }
  var paint = {
    "line": {
      "line-color": "yellow",
      "line-width": ["case",
      ["==", ["feature-state", "click"], true] ,6,
      ["==", ["feature-state", "highlight"], true] ,2,
      0],
      "line-opacity": ["case",
        ["==", ["feature-state", "click"], true] ,1,
        ["==", ["feature-state", "highlight"], true] ,0.7,
        0]
    },
    "circle": {
      "circle-radius": 14,
      "circle-color": "transparent",
      "circle-stroke-color": "yellow",
      "circle-stroke-width": 4,
      "circle-opacity": ["case",
      ["==", ["feature-state", "click"], true] ,1,
      ["==", ["feature-state", "highlight"], true] ,0.7,
      0],
      "circle-stroke-opacity": ["case",
      ["==", ["feature-state", "click"], true] ,1,
      ["==", ["feature-state", "highlight"], true] ,0.7,
      0]
    },
    "fill": {
      "fill-color": ["case",
      ["==", ["feature-state", "click"], true] , "yellow",
      ["==", ["feature-state", "highlight"], true] ,"yellow",
      "transparent"],
      "fill-opacity": 0.7
    },
    "fill-extrusion": {
      "fill-extrusion-color": ["case", 
          ["==", ["feature-state", "click"], true] ,"yellow",
          ["==", ["feature-state", "highlight"], true] ,"yellow",
        color],
      "fill-extrusion-opacity": 0.6,
    }
  }

  return paint[featureType]
}

/**
 * 
 * @memberof cozMap
 * @method getFeatures
 * @param {*} map 
 * @param {*} e 
 * @param {*} l 
 */

function getFeatures(map, e, l) {
  var layers = map.getStyle().layers;
  if (layers.indexOf("gl-draw-polygon-stroke-inactive.cold") > -1) {
    if (map.getPaintProperty("gl-draw-polygon-stroke-inactive.cold", "line-color") && map.getPaintProperty("gl-draw-polygon-stroke-inactive.cold", "line-color") != "red") {
      return []
    }
  }
  
  //SHOULD MAYBE MOVE THIS OUT OF HERE TO A HELPER FILE

  var point;

  if (e.point && e.lngLat) {
    point = e.point;
  }
  if (!e.point && e.lngLat) {
    point = map.project(e.lngLat);
  }
  if (!e.point && !e.lngLat) {
    point = map.project(e.coordinates);
  }

  var bboxClickTargetSize = ((map.getZoom() * 1.5) < 18) ? 18 : map.getZoom() * 1.5;

  var bbox = [
    [point.x - bboxClickTargetSize / 2, point.y - bboxClickTargetSize / 2 ],
    [point.x + bboxClickTargetSize /2, point.y + bboxClickTargetSize /2]
  ]

  var bboxCoords = [map.unproject(bbox[0]), map.unproject(bbox[1])]

  var getFeatureOpts = getQuery((window.location.search).substring(1));
  if (getFeatureOpts && getFeatureOpts.debug === "true") {

    var poly = [
      [bboxCoords[0].lng, bboxCoords[0].lat],
      [bboxCoords[1].lng, bboxCoords[0].lat],
      [bboxCoords[1].lng, bboxCoords[1].lat],
      [bboxCoords[0].lng, bboxCoords[1].lat],
      [bboxCoords[0].lng, bboxCoords[0].lat]
    ]

    if (!map.getSource("clicked-bbox")) {
      map.addSource("clicked-bbox", {
        'type': 'geojson',
        'data': {
          'type': 'Feature',
          'geometry': {
            'type': 'Polygon',
            'coordinates': [poly]
          }
        }
      });
      map.addLayer({
        'id': 'clicked-bbox',
        'type': 'fill',
        'source': 'clicked-bbox',
        'layout': {},
        'paint': {
          'fill-color': 'firebrick',
          'fill-opacity': 0.5
        }
      });
    }else{
      map.getSource("clicked-bbox").setData({
        'type': 'Feature',
        'geometry': {
          'type': 'Polygon',
          'coordinates': [poly]
        }
      })
    }



  }

  var queriedFeatures;

  if (l && l.length > 0) {
    queriedFeatures = map.queryRenderedFeatures(point, {
      layers: l
    });
  } else {
    queriedFeatures = map.queryRenderedFeatures(point);
  }

  if (getFeatureOpts && getFeatureOpts.debug === "true") {
    console.log(e.point)
    console.log({queriedFeatures})
  }

  var features = cleanFeatures(queriedFeatures);

  function cleanFeatures(objects) {
    return objects.filter(function (obj) {
      if (obj && obj.source != "composite" && obj.layer.metadata && obj.layer.metadata.popup) {
        return obj
      }
    })
  }

  if (!features) {
    return
  }

  //SORT FEATURE PROPERTIES BY FIELD NAME
  features.forEach(function(f) {
    var props = {};
    Object.keys(f.properties).sort().forEach(function(key) {
      props[key] = f.properties[key];
    });
    f.properties = props;
  })

  return features

}

function popup(map, features, n, highlightOnly) {

  map.once("contextmenu", function() {
    highlightClearFeature(popupMap, highlightType)
    if (document.getElementById("map--info-window-close")) {
      document.getElementById("map--info-window-close").click();
    }
  })

  var popupMap = map;
  var highlightType = (!highlightOnly) ? "click" : "highlight"

  if (!features || features.length === 0) {
    highlightClearFeature(popupMap, highlightType, true)
    return
  }

  var featuresTemp = features.filter(f => {
    return f != null
  })

  var popupFeatures = removeDuplicates(featuresTemp, "id")

  if (!popupFeatures.length === 0 && !highlightOnly) {
    highlightClearFeature(popupMap, "click")
    return
  }

  if (highlightOnly && popupFeatures.length > 0) {
    highlightAddFeature(map, features[0], true);
    return
  }
  
  var x = (!n) ? 0 : n;

  highlightAddFeature(popupMap, popupFeatures[x])

  var popupDiv = document.createElement("div");

  // GET TITLE OR USE FEATURE PROPERTIES

  var popupHeading = "Feature Properties";

  for (var v in popupFeatures[x].properties) {
    if ((v.toUpperCase() === "NAME" || v.toUpperCase() === "TITLE") && popupFeatures[x].properties[v] && popupFeatures[x].properties[v] != null && popupFeatures[x].properties[v] != "null") {
      popupHeading = (popupFeatures[x].properties[v])//.substring(0,20).trim();
      // console.log(popupFeatures[x].properties[v] )
      //if ((popupFeatures[x].properties[v]).length > 20) popupHeading += "..."
    }
  }

  if (popupHeading === "Feature Properties" && popupFeatures[x].layer.metadata && popupFeatures[x].layer.metadata.name) {
    popupHeading = popupFeatures[x].layer.metadata.name//.substring(0,20).trim()
  }

  var popupDivTitle = popupShowMoreFeatures(popupMap, popupFeatures, popupHeading, x);

  popupDiv.appendChild(popupDivTitle);

  var popupHtml = popupBuildHtml(map, popupFeatures[x]);

  popupDiv.appendChild(popupHtml);

    /**
   * SHOULD MOVE THIS TO CREATING THE DOM ELEMENT IN THE JS FILE INSTEAD OF IN THE HTML WOULD NEED TO HAVE A STYLESHEET TO GO ALONG WITH IT
   */

  var popupWindow = document.getElementById("map--info-window-content");

  if (popupWindow.children.length > 0) popupWindow.removeChild(popupWindow.childNodes[0]);

  popupWindow.appendChild(popupDiv);

  document.getElementById("map--info-window").style.display = "block";
    
  if (window.innerWidth > 768) {
    // var width = document.querySelector("#map--info-window-content").children[0].children[1].offsetWidth
    // console.log(document.querySelector("#map--info-window-content").children[0].children[1], width)
    document.getElementById("map--info-window").style.width = "300px"
  }else{
    document.getElementById("map--info-window").style.width = "100%"
  }




}

function popupShowMoreFeatures(map, features, heading, x) {
  var newMap = map;
  var div = document.createElement("div");
  div.style.textAlign = "center";
  div.style.height = "auto"
  div.style.padding = "0 0 10px 0"
  div.style.borderBottom = "solid thin lightgray"

  var prev = document.createElement("button");
  prev.classList = "btn btn-link btn-sm";
  prev.innerHTML = "&#9664";

  prev.style.marginLeft = "10px"
  prev.style.float = "left"
  prev.onclick = function() {
    popup(newMap, features, x-1)
  }

  var next = document.createElement("button");
  next.classList = "btn btn-link btn-sm";
  next.style.marginRight = "10px";
  next.innerHTML = "&#9654";
  next.style.float = "right";
  next.style.position = "absolute";
  next.style.top = "10px";
  next.style.right = "20px";
  next.onclick = function() {
    popup(newMap, features, x+1)
  }

  if (x == (features.length - 1)) {
    next.style.opacity = "0";
    next.style.visibility = "hidden";
    next.style.cursor = "default";
  }

  if (x == 0) {
    prev.style.opacity = "0";
    prev.style.visibility = "hidden";
    prev.style.cursor = "default";
  }

  div.appendChild(prev);
  
  var span = document.createElement("div");
  span.textContent = heading;
  span.style.fontSize = "18px";
  span.style.lineHeight = "28px";
  span.style.fontWeight = "600";
  span.style.margin = "0 48px";
  div.appendChild(span)

  div.appendChild(next);

  return div

}

function popupBuildHtml(map, f) {

  var popupDiv = document.createElement("div");

  var popupTemplate = (!f.layer.metadata) ? true : (f.layer.metadata.popup && f.layer.metadata.popup === false) ? false : (f.layer.metadata.popup === true) ? [] : f.layer.metadata.popup

  if (popupTemplate || popupTemplate === undefined) {
    var table = document.createElement("table");
    table.classList = "table table-striped";
    // table.style.width = "auto";
    table.style.minWidth = "280px"

    var tbody = document.createElement("tbody");

    var keys = Object.keys(f.properties);

    var excludeFields = [
      "ACCOUNT_NUM",
      "CENTROID_X",
      "CENTROID_Y",
      "Creator",
      "DATEUPDATE",
      "END_X",
      "END_Y",
      "ERU_CHARGE",
      "Editor",
      "Enabled",
      "FID",
      "FIRST_NOTE",
      "GEO_ID",
      "GlobalID",
      "IKey",
      "INSIDE_X",
      "INSIDE_Y",
      "Land_Use_Name",
      "Log_Date",
      "MID_X",
      "MID_Y",
      "OBJECTID",
      "OID",
      "OLDFIELDID",
      "SHAPE_Area",
      "SHAPE_Leng",
      "SHAPE_Length",
      "START_X",
      "START_Y",
      "Shape_Area",
      "Shape_Leng",
      "Shape_Leng",
      "Shape_Length",
      "Shape_Length",
      "TEMP",
      "acres_1",
      "ca",
      "color",
      "dt_created",
      "dt_edited",
      "dt_updated",
      "id",
      "id",
      "l_bearing",
      "obs_pk",
      "pano",
      "point_y",
      "point_x",
      "shape_leng",
      "skey",
      "userkey",
      "vtlid",
      "xcoord",
      "ycoord",
      "extrudeheight",
      "parcel_number",
      "uuid",
      "plan_local"
    ];

    excludeFields.map(function(f,i) {
      excludeFields[i] = f.toUpperCase()
    });

    //GET POPUP VALUES FROM LAYER METADATA IF THEY EXIST
    var layers = map.getStyle().layers;

    var layer = layers.filter(l => {
      return l.id === (f.layer.id).replace("cozHighlight_", "")
    });

    var popupValues = (!layer[0].metadata) ? null : (!layer[0].metadata.popup) ? null : layer[0].metadata.popup;

    if (popupValues && popupValues != true) {
      // console.log(popupValues.length)
      keys = keys.filter(k => {
        return popupValues.indexOf(k) > -1
      })
    }

    var hasImage = false;

    table.innerHTML += `<!-- ${f.layer.id} -->`

    keys.forEach(function(key, i) {
      if (excludeFields.indexOf(key.toUpperCase()) < 0) {
        var val = f.properties[key];  
        if (val && val != null && val != "" && val != " " && val != undefined && val != "null") {
          var property = (isMapillary(val, f)) ? formatMapillary(val) : (isEpochDate(val)) ? formatDate(val) : (isLink(val)) ? formatLink(val) : (isParcel(val)) ? formatParcel(val) : (isNumber(val)) ? formatNumber(val) : val;
          tbody.innerHTML += `<tr><td>${formatTitle(key)}</td><td>${property}</td></tr>`;
        }
        // console.log(isImage(key, val))
        if (!hasImage) hasImage = isImage(key, val)
      }
    });
    // console.log(hasImage)
    if (hasImage != false) {
      var popupImageLink = document.createElement("a");
      popupImageLink.href = hasImage;
      popupImageLink.target = "_blank";
      
      var popupImg = document.createElement("img");
      popupImg.src = hasImage;
      popupImg.style.width = "100%";

      popupImageLink.appendChild(popupImg)
      popupDiv.appendChild(popupImageLink)
    }

    table.appendChild(tbody)
    popupDiv.appendChild(table)
  }


  return popupDiv
}

export {
  getFeatures,
  popup,
  highlightAddFeature,
  highlightClearFeature
}

/****
 * HELPERS
 */


function isImage(key, value) {
  if (key === "alt_link") return false
  if (value.toString().indexOf("https") != 0) return false
  if (value.split(",")) {
    value = value.split(",")[0]
  }
  let img = value.split(".");
  let images = ["JPG", "JPEG", "PNG"]

  console.log(images.indexOf(img[img.length -1].toUpperCase()) )
  if (images.indexOf(img[img.length -1].toUpperCase()) < 0) {
    return false
  }else{
    return value
  }
}

/*https://firstclassjs.com/remove-duplicate-objects-from-javascript-array-how-to-performance-comparison/*/
function removeDuplicates(array, key) {
  let lookup = new Set();
  return array.filter(obj => !lookup.has(obj[key]) && lookup.add(obj[key]));
}

function formatTitle(str) {
  return str.replace(/_/g, " ");
}

function isMapillary(value, feature) {
  return (value === 'key' && feature.source === 'mapillary')
}

function formatMapillary(value) {
  return `<img src='https://d1cuyjsrcm0gby.cloudfront.net/${value}/thumb-320.jpg'>`
}

function isEpochDate (value) {
  var simpleDateRegex = new RegExp(/^\d{13}$/)
  return simpleDateRegex.test(value)
}

function formatDate(value) {
  var valueDate = new Date(value)
  return valueDate.toLocaleDateString()
}

function isLink(value) {
  var urlRegExCheck = new RegExp(/[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi);
  return urlRegExCheck.test(value)
}

function formatLink(value) {
  if (value.split(",").length > 1) {
    value = value.split(",")[0]
  }
  return `<a href="${(value)}" target='_blank'><i class='fas fa-external-link-alt'></i> View Resource</a></td></tr>`
}

function isParcel(value) {
  var parcelRegex = new RegExp(/^\d{2}[-]\d{2}[-]\d{2}[-]\d{2}[-]\d{3}$/)
  return (value == "PARCELNUM" || parcelRegex.test(value))
}

function formatParcel(value) {
  return `<a href='https://muskingumoh-auditor-classic.ddti.net/Data.aspx?ParcelID=${value}' target='_blank' class='text-center'><i class='fas fa-external-link-alt'></i> ${value}</a>`
}

function isNumber(value) {
  var isNumber = /^\d*\.?\d*$/;
  var isYear = /^[12][0-9]{3}$/;
  return isNumber.test(value) && !isYear.test(value)
}

function formatNumber(value) {
  return Number(value).toLocaleString()
}

/**
 * genId
 * Generate an ID of x length, NOT IN USE
 * @param {Number} length 
 */
function genId(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}