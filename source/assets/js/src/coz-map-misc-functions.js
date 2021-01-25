import {token, maxBounds, mapillaryToken} from './config'
import {updateQueryStringParam} from './coz-helpers';
import {cozSidebarToggleControl} from './coz-sidebar-toggle';
import {getLayers, getQuery, getParent} from './coz-helpers';
import {mapCheckLoading} from './coz-mapCheckLoading';
import {localGeocoder} from './coz-local-geocoder.js';
import { copySync } from 'fs-extra';

/**
 * Function to print the rendered map and add a title using a custom version of https://github.com/Eddie-Larsson/mapbox-print-pdf
 * @memberof cozMap
 * @method mapPrint
 * @param {object} map mapbox map object to check
 * @param {string} title print map title
 * @param {object} options print options
 */

function mapPrint(map, title, opts) {

  if (opts) {
    var cozPrintOptions = opts
  } else {
    var cozPrintOptions = {
      disclaimer: 'City of Zanesville does not guarantee the accuracy of this data. This map is subject to all terms and conditions of the disclaimer posted on this website.',
      northArrow: '/assets/img/north_arrow.svg',
      logo: '/assets/img/coz_logo_bw.png',
      defaultTitle: title,
      info: "",
      previewContainer: "modal-print--preview"
    }
  }

  if (document.querySelector('.coz-sidebar--print-button')) {
    var printPreviewBtn = document.querySelector('.coz-sidebar--print-button');
    printPreviewBtn.addEventListener('click', function () {
      if (typeof map.getLayer('selected') === "undefined") {
        cozPrintOptions.info = "";
      }
      PrintControl.prototype.initialize(map, cozPrintOptions)
    })
  }

  if (document.getElementById('export-map') && document.getElementById('export-loader')) {
    var printExportBtn = document.getElementById('export-map');
    printExportBtn.addEventListener('click', function (e) {
      var exportLoader = document.getElementById('export-loader');
      exportLoader.classList.add("loading");
      document.addEventListener("mapExported", function (e) {
        exportLoader.classList.remove("loading");
        var exportModal = getParent(printExportBtn, 'modal');
        exportModal.classList.remove('active');
        window.location.hash = "close";
      });
      setTimeout(function () {
        PrintControl.prototype.exportMap();
      }, 500)
      e.stopPropagation(e);
      e.preventDefault(e);
    });
  }
}

/**
 * @memberof cozMap
 * @method mapAddControls
 * @param {*} map 
 * @param {*} options 
 */

function mapAddControls(map, options) {

  map.addControl(new cozSidebarToggleControl(), 'top-left');

  map.addSource('attribution', {
    type: 'geojson',
    data: {
        type: 'FeatureCollection',
        features: []
    },
    attribution: '<a href="http://www.coz.org/engineering">Map &copy; 2018 City of Zanesville</a>'
  });

  map.addLayer({
    id: 'attribution',
    source: 'attribution',
    type: 'fill'
  });

  var t = (options && options.t) ? options.t : token;
  var f = (options && options.f) ? options.f : false;
  var geocoderId = (options && options.geocoderId) ? options.geocoderId : null;
  var geocoderCallback = (options && options.geocoderCallback) ? options.geocoderCallback : null;
  var locateCallback = (options && options.locateCallback) ? options.locateCallback : null;

  if (!options || (options && options.scale != false)) {
    var newDiv = document.createElement('div');
    newDiv.style.width = "1in";
    newDiv.id = "dpi";
    document.body.appendChild(newDiv);

    var ratio = (screen.width / screen.height);

    console.log(ratio)

    if (ratio < 1.6) {
      console.warn("This screen is low resolution therefore errors may occur when printing with a map scale.");
      // document.getElementById("coz-sidebar--legend").innerHTML += "<em>This screen is low resolution therefore the map scale may not work properly.</em>"
    }

    var scale = new mapboxgl.ScaleControl({
      unit: 'imperial'
    });
    
    map.addControl(scale);
  }

  if (!options || (options && options.geocoder != false)) {
    if (!map.getSource('geocodePointSource')) {
      map.addSource("geocodePointSource", {
        "type": "geojson",
        "data": {
          "type": "FeatureCollection",
          "features": []
        }
      })
    }
    map.addLayer({
      "id": "geocodePoint",
      "source": "geocodePointSource",
      "type": "circle",
      "paint": {
        "circle-radius": 10,
        "circle-color": "#007cbf"
      },
      "layout": {
        "visibility": "none"
      }
    });

    var geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      localGeocoder: localGeocoder,
      zoom: 20.5,
      placeholder: "City Parcel or Address",
      limit: 10,
      countries: 'us',
      marker: false,
      bbox: [-82.1, 39.8, -81.8, 40.2]
    });

    if (geocoderId) {
      document.getElementById(geocoderId).appendChild(geocoder.onAdd(Map));
    } else {
      map.addControl(geocoder, 'top-left');
    }

    geocoder.on('result', function (result) {
      map.fire('click', {lngLat: {"lng": 0, "lat": 0}})
      if (geocoderCallback) {
        geocoderCallback(result)
      } else {
        map.flyTo({
          center: result.result.geometry.coordinates,
          zoom: 18
        });
        map.setLayoutProperty('geocodePoint', 'visibility', 'visible');
        map.on('click', function () {
          map.setLayoutProperty('geocodePoint', 'visibility', 'none');
        });
        map.getSource('geocodePointSource').setData(result.result.geometry);

      let txt = "";
      if (result.result.address) {
        let resultText = (result.result.address).split(",");
        txt = resultText[0] + "<br>" + resultText[1];
      };

      if (result.result.place_name) {
        let resultText = (result.result.place_name).split(",");
        txt = "<strong>" + resultText[0] + "</strong><br>" + resultText[1];
      }

        new mapboxgl.Popup()
          .setLngLat(result.result.geometry.coordinates)
          .setHTML(txt)
          .on('close', function () {
            map.setLayoutProperty('geocodePoint', 'visibility', 'none');
          })
          .addTo(map);
      }
    });
  }

  if (!options || (options && options.navigation != false)) {
    map.addControl(new mapboxgl.NavigationControl());
  }

  if (!options || (options && options.gps != false)) {
    var gpscontrol = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true
    });

    map.addControl(gpscontrol);

    gpscontrol.on('geolocate', function (e, lc) {
      if (locateCallback) {
        lc = locateCallback;
        lc(e)
      }
      // gmapsorig = e.coords.latitude + "," + e.coords.longitude;
    });
  }

  /*map.addControl(new mapboxgl.FullscreenControl());*/

  class clearHighlightControl {
    onAdd(map){
      this.map = map;
      this.container = document.createElement('div');
      this.container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
      this.container.innerHTML = "<button class='mapboxgl-ctrl-icon'><icon class='far fa-square fa-2x'></button>";
      this.container.id = "mapHighlightReset";
      this.container.onclick = function() {
        highlight(map);
        // this.children[0].style.color = "inherit"
      }
      return this.container;
    }
    onRemove(){
      this.container.parentNode.removeChild(this.container);
      this.map = undefined;
    }
  }

  // map.addControl(new clearHighlightControl(), 'top-right');

}

/*
New way to highlight features using setFeatureState() API
Not working with data uploaded to Mapbox yet as they overwrite the feature.id 
*/

/*
scope variables for selected features for highlight and popup
grab layer id, source and source layer to set and clear highlight
*/
var clickedId = "";
var selectedLayerId = 999999999;
var selectedSource = "";
var selectedSourceLayer = "";
var newselectedLayerId = -1; /* for when you mouseover the same feature/layer */
var internalTiles = ["TaxParcels_Latest_wgs84", "COZ_Parks_wgs84", "COZ_Trails_wgs84", "COZ_Zoning_wgs84"]
// var internalTiles = [""];

// function clearHighlight(map, s, l, i) {
//   console.log(selectedLayerId, selectedSourceLayer, selectedSource, internalTiles.indexOf(selectedSourceLayer))
//   if (selectedLayerId != -1 && internalTiles.indexOf(selectedSourceLayer) > -1) {
//     console.log('clearing highlight')
//     map.setFeatureState({
//       source: s,
//       sourceLayer: l,
//       id: i
//     }, { 'hover': 0 })
//     map.off('click', clearHighlight)
//   }
// }

/**/

/**
 * 
 * @memberof cozMap
 * @method getFeature
 * @param {*} map 
 * @param {*} e 
 * @param {*} l 
*/

function getFeature(map, e, l) {
  
  if ((document.getElementsByClassName('mapbox-gl-draw_ctrl-draw-btn active')).length > 0) {
    return []
  }

  var lngLat;
  var layers = (!l) ? [] : l;

  if (e.point && e.lngLat) {
    var point = e.point;
    lngLat = e.lngLat;
  }
  if (!e.point && e.lngLat) {
    console.log(e);
    lngLat = {"lng": e.lngLat[0], "lat":e.lngLat[1]}
    var point = map.project(e.lngLat);
  }
  if (!e.point && !e.lngLat) {
    console.log(e);
    var point = map.project(e.coordinates);
    lngLat = {"lng": e.coordinates[0], "lat":e.coordinates[1]}
  }
  var queriedFeatures;

  var bboxClickTargetSize = 20;

  var bbox =   [[point.x - bboxClickTargetSize / 2, point.y - bboxClickTargetSize / 2],[point.x + bboxClickTargetSize / 2, point.y + bboxClickTargetSize / 2]]

  var bboxCoords = [map.unproject(bbox[0]),map.unproject(bbox[1])]

  var getFeatureOpts = getQuery((window.location.search).substring(1));
  if (getFeatureOpts && getFeatureOpts.showClickTarget === "true") {
    console.log('showing click target')
 
    var poly = [
      [bboxCoords[0].lng, bboxCoords[0].lat],
      [bboxCoords[1].lng, bboxCoords[0].lat],
      [bboxCoords[1].lng, bboxCoords[1].lat],
      [bboxCoords[0].lng, bboxCoords[1].lat],
      [bboxCoords[0].lng, bboxCoords[0].lat]
    ]

    var number = Math.random()

    map.addLayer({
      'id': 'bbox' + number,
      'type': 'fill',
      'source': {
      'type': 'geojson',
      'data': {
        'type': 'Feature',
        'geometry': {
          'type': 'Polygon',
          'coordinates': [poly]
          }
        }
      },
      'layout': {},
      'paint': {
      'fill-color': 'firebrick',
      'fill-opacity': 0.5
      }
    });
  }

  if (layers.length > 0) {
    queriedFeatures = map.queryRenderedFeatures(bbox, {
      layers: layers
    });
  }else{
    queriedFeatures = map.queryRenderedFeatures(bbox);
  }

  var features = cleanFeatures(queriedFeatures);
  
  function cleanFeatures(objects) {
    return objects.filter(function(obj,i) {
      if (obj && obj.source != "composite")
        return obj
    })
  }


  // features.forEach(function(f) {
  //   console.log(f.properties)
  //   var props = {};
  //   Object.keys(f.properties).sort().forEach(function(key) {
  //     props[key] = f.properties[key];
  //   });
  //   f.properties = props;
  //   console.log(f.properties)
  // })

  var feature = (features.length > 0) ? features : null;

  if (!feature) {
    return
  }

  if (feature && feature.source === "composite") {
    return
  }

  return feature[0]

}

// var filter = "";

/**
 * clear highlted features on the map
 * @param {*} map 
 * @param {string} filter 
 * @param {string} ext 
 */

function highlightReset(map, filter, ext) {
  var filter = (!filter) ? "vtlid" : filter;
  var ext = (!ext) ? "_clicked" : ext;
  var _layers = getLayers(map);    
  _layers.map(function(_l) {
    if (_l.indexOf(ext) > -1) {
      map.setFilter(_l, ["==", filter, ""])
    }
  });
}

/**
 * Highlight features by adding a colored outline or circle-color to the a new layer with the same source as the clicked feature
 * @param {*} map 
 * @param {*} feature 
 * @param {*} options 
 */   

function highlight(map, feature, options) {
  var _opts = {
    filter: "vtlid",
    color: "yellow",
    suffix: "_clicked"
  }

  if (options && options.filter) _opts.filter = options.filter;
  if (options && options.color) _opts.color = options.color;
  if (options && options.suffix) _opts.suffix = options.suffix;
  
  //ADD THIS FOR FEATURES THAT ARE PULLED FROM ARCGIS ONLINE THEY DO NOT HAVE A VTILD FIELD FROM SURVEY123
  if (feature && !feature.properties[_opts.filter] && feature.properties.objectid) {
    _opts.filter = "objectid"
  }

  if (feature && !feature.properties[_opts.filter] && feature.properties.OBJECTID) {
    _opts.filter = "OBJECTID"
  }

  if (feature && !feature.properties[_opts.filter] && feature.properties.ObjectId) {
    _opts.filter = "ObjectId"
  }

  highlightReset(map, _opts.filter, "_clicked");

  map.on("contextmenu", function() {
    highlightReset(map, _opts.filter, "_clicked");
    if (document.getElementById("map--info-window-close")) {
      document.getElementById("map--info-window-close").click();
    }
  })

  var _layers = getLayers(map);

  if (!feature) {
    return
  }

  if (feature.layer.type === "Feature" || feature.layer.source === "composite") {
    return
  }

  var _clicked = feature.properties[_opts.filter];

  // console.log(feature, _clicked)

  var _paint;
  var _type = "line";
  if (feature.layer.type === "line" || feature.layer.type === "fill") {
    _paint = {
      "line-color": _opts.color,
      "line-width": 6
    }
  }

  if (feature.layer.type === "circle" || feature.layer.type === "symbol") {
    _type = "circle";
    _paint = {
      "circle-radius": 12,
      "circle-color": _opts.color
    }
  }

  if (feature.layer.type === "fill-extrusion") {
    _type = "fill-extrusion";
    _paint = feature.layer.paint;
    _paint["fill-extrusion-color"] = "yellow"
  }

  if (_layers.indexOf(feature.layer.id + _opts.suffix) < 0) {
    if (feature.layer["source-layer"]) {
      console.log('vector tile source')
      setTimeout(function() {
        map.addLayer({
          "id": feature.layer.id + _opts.suffix,
          "type": _type,
          "source": feature.layer.source,
          "source-layer": feature.layer["source-layer"],
          "paint": _paint,
          'filter': ['==', _opts.filter, _clicked],
          'layout': {
            'visibility': 'visible'
          }
        });
      }, 1)

    } else {
      console.log('geojson source')
      setTimeout(function() {
        map.addLayer({
          "id": feature.layer.id + _opts.suffix,
          "type": _type,
          "source": feature.layer.source,
          "paint": _paint,
          'filter': ['==', _opts.filter, _clicked],
          'layout': {
            'visibility': 'visible'
          }
        });
      }, 1);
    }
  }else{
    setTimeout(function() {
      map.setFilter(feature.layer.id + _opts.suffix, ["==", _opts.filter, _clicked]);
    }, 1)
  }
}

/**
 * map highlight function
  * @memberof cozMap
  * @method highlight
  * @param {*} map 
  * @param {*} feature 
  */

function  highlightFeatureState(map, feature) {
  var filter = "";
  /*
  try adding sources that match the clicked layer source with 
  */

  if (typeof map.getLayer('selected') != "undefined") {
    map.removeLayer('selected')
  }
  
  /*
  clear highlight when clicking on a feature that is using the backup method for highlighting - selected features
  */

  // if (feature != null > 0 && selectedLayerId != -1 && internalTiles.indexOf(selectedSourceLayer) > -1 && selectedLayerId != newselectedLayerId) {
  //   console.log("1")
  //   map.setFeatureState({
  //     source: selectedSource,
  //     sourceLayer: selectedSourceLayer,
  //     id: newselectedLayerId
  //   }, {
  //     'hover': 0
  //   })
  //   selectedLayerId = -1;
  //   newselectedLayerId = -1;     
  // }

  if (selectedLayerId != 999999999 && internalTiles.indexOf(selectedSourceLayer) > -1) {
    console.log("2")
    map.setFeatureState({
      source: selectedSource,
      sourceLayer: selectedSourceLayer,
      id: newselectedLayerId
    }, {
      'hover': 0
    })
    selectedLayerId = 999999999;
    newselectedLayerId = 999999999;
  }
  if (feature != null) {
    console.log('setting feature filter')
    if (feature.properties.PARCELNUM) {
      clickedId = feature.properties.PARCELNUM;
      filter = "PARCELNUM"
    }
    if (feature.properties.OBJECTID) {
      clickedId = feature.properties.OBJECTID;
      filter = "OBJECTID";
    }
    if (feature.properties.vtlid) {
      clickedId = feature.properties.vtlid;
      filter = "vtlid"
    }
    newselectedLayerId = feature.id;
    selectedSource = feature.layer.source;
    selectedSourceLayer = feature.layer["source-layer"];

    if (internalTiles.indexOf(selectedSourceLayer) > -1) {
      console.log('internal tiles using feature-state')
      /*reset hover state*/
      if (newselectedLayerId != selectedLayerId && newselectedLayerId != -1) {
        map.setFeatureState({
          source: feature.layer.source,
          sourceLayer: feature.layer["source-layer"],
          id: selectedLayerId
        }, {
          'hover': 0
        })
        selectedLayerId = newselectedLayerId
      }

      /*set hover state for highlighted feature*/
      setTimeout(function () {
        map.setFeatureState({
          source: feature.layer.source,
          sourceLayer: feature.layer["source-layer"],
          id: selectedLayerId
        }, {
          'hover': 1
        })
      }, 0);
    } else {
      console.log('falling back to setFilter method')
      if (clickedId) {
        console.log(clickedId)
        if (!map.getSource('selectedSource')) {
          console.log('adding selectedSource')
          map.addSource('selectedSource', {
            "type": "geojson",
            "data": {
              "type": "FeatureCollection",
              "features": []
            }
          })
        }
        setTimeout(function () {
          var selPaint;
          var layerType = "line";
          if (feature.layer.type === "line" || feature.layer.type === "fill") {
            selPaint = {
              "line-color": "yellow",
              "line-width": 6
            }
          }

          if (feature.layer.type === "circle") {
            layerType = "circle";
            selPaint = {
              "circle-radius": 12,
              "circle-color": "yellow"
            }
          }

          if (feature.layer["source-layer"]) {
            console.log('vector tile source')
            map.addLayer({
              "id": "selected",
              "type": layerType,
              "source": feature.layer.source,
              "source-layer": feature.layer["source-layer"],
              "paint": selPaint,
              'filter': ['==', filter, clickedId],
              'layout': {
                'visibility': 'visible'
              }
            });
          } else {
            console.log('geojson source')
            map.addLayer({
              "id": "selected",
              "type": layerType,
              "source": feature.layer.source,
              "paint": selPaint,
              'filter': ['==', filter, clickedId],
              'layout': {
                'visibility': 'visible'
              }
            });
          }
        }, 0)
      }
    }
  }
}

/**
 * Too complicated map popup function
 * @param {*} map 
 * @param {*} e 
 * @param {*} feature 
 * @param {*} fn 
 * @param {*} hidePopup 
 */

function mapGetInfo(map, e, feature, fn, hidePopup, callback) {

  let infoWindow = document.getElementById("map--info-window-content");

  if (!feature) {
    infoWindow.parentElement.style.display = "none";
    return
  }

  function isEmpty(obj) {
    return Object.keys(obj).length === 0;
  }

  if (isEmpty(feature.properties)) {
    console.log("no feature properties, exiting mapGetInfo")
    infoWindow.parentElement.style.display = "none";
    return
  }


  function titleCase(str) {
    var newstring = str.replace(/_/g, "&nbsp;");
    return newstring.toLowerCase().split(' ').map(function(word) {
      return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ');
  }

  var aliasFields = {
    "AADT": "Average Annual Daily Traffic",
    "PARCELNUM": "Parcel ID",
    "Land_Use": "Land Use",
    "MASTER_TNM": "Tax Name",
    "FIRST_OWNE": "Owner",
    "ERU": "ERU for Account",
    "Sump_Depth": "Sump Depth",
    "Owner_1": "Owner",
    "Legal_Description": "Legal Description",
    "ELEV": "Elevation",
    "SQFT": "Impervious Surface",
    "FIELDID": "Field ID",
    "url_pdf": "URL for Inpsection Report",
    "IDUP": "Upstream Asset ID",
    "IDDN": "Downstream Asset ID",
    "INSPECTLOG": "Inspection Log",
    "audlink": "Auditor Link"
  }

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
    "vtlid"
  ];

  excludeFields.map(function(f,i) {
    excludeFields[i] = f.toUpperCase()
  });

  /*
  simple number function
  */

  function toNumber(x) {
    var y = Number(x);
    return y.toLocaleString('en-US')
  }

  var isNumber = /^\d*\.?\d*$/;

  // console.log(e)

  if (e.point && e.lngLat) {
    console.log('a')
    var point = e.point;
    var lngLat = e.lngLat;
  }
  if (!e.point && e.lngLat.lat) {
    console.log('b')
    var lngLat = {"lng": e.lngLat.lng, "lat":e.lngLat.lat}
    var point = map.project(e.lngLat);
  }
  if (!e.point && e.lngLat && !e.lngLat.lat) {
    console.log('c')
    var lngLat = {"lng": e.lngLat[0], "lat":e.lngLat[1]}
    var point = map.project(e.lngLat);
  }
  if (!e.point && !e.lngLat) {
    console.log('d')
    var point = map.project(e.coordinates);
    var lngLat = {"lng": e.coordinates[0], "lat":e.coordinates[1]}
  }

  console.log(lngLat)

  if (feature != null) {
    // updateQueryStringParam("clickedId", clickedId);
    setTimeout(function() {
      updateQueryStringParam("layers", feature.layer.id);
      updateQueryStringParam("lng", lngLat.lng);
      updateQueryStringParam("lat", lngLat.lat);
    }, 100);
  }

  if (hidePopup != true) {

    if (!clickedId && feature != null) {
      clickedId = (!feature.properties.vtlid) ? feature.properties.objectid : feature.properties.vtlid;
    }
    if (feature != null) {
      if (fn) {
        console.log('custom popup function')
        fn(map);
      } else {
        var urlRegExCheck = new RegExp(/[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi);

        var keys = Object.keys(feature.properties);
        keys = keys.sort();
        console.log(keys)

        setTimeout(function () {
          if (window.innerWidth > 768) {
            var popupTxt = "<h5>Feature Properties</h5><table class='table table-striped'>";
          } else {
            var popupTxt = "<table class='table table-striped'>";
          }
          keys.map(p => {
            let p_prop = feature.properties[p]
            // console.log(p_prop)
            if (p_prop && p_prop != null && p_prop != "" && p_prop != " ") {
              var pTitle = !aliasFields[p] ? titleCase(p) : aliasFields[p];
              if (excludeFields.indexOf(p.toUpperCase()) === -1 && p_prop != "null") {
                if (p === 'key' && feature.source === 'mapillary') {
                  popupTxt += "<img src='https://d1cuyjsrcm0gby.cloudfront.net/" + p_prop + "/thumb-320.jpg'>"
                }
                else if (urlRegExCheck.test(p_prop)) {
                  popupTxt += "<tr><td>" + pTitle +"</td><td><a href='" + (p_prop) + "' target='_blank'><i class='fas fa-external-link-alt'></i> More Info</a></td></tr>"
                }
                else if (p.toUpperCase() === "ORD_DATE" || p === "CAPTURED_AT" || p.toUpperCase().includes("DATE")) {
                  var newDate = new Date(p_prop);
                  popupTxt += "<tr><td>" + p.replace(/_/, "&nbsp") + "</td><td>" + newDate.toLocaleDateString() + "</td></tr>";
                }
                else{
                  var featureValue = (isNumber.test(p_prop)) ? toNumber(p_prop) : p_prop;
                  popupTxt += "<tr><td>" + (pTitle) + "</td><td>" + featureValue + "</td></tr>"
                }
              }
            }
          })
          /*
          get location for popup and for directions
          */
          var popupLoc = "";
          if (lngLat) {
            popupLoc = [lngLat.lng, lngLat.lat]
          } else {
            popupLoc = e;
          }
          // map.flyTo({
          //   center: popupLoc
          // })
          popupTxt += "</table><br /><!--button onclick='exportTableToCSV()'>Export HTML Table To CSV File</button-->";
          popupTxt += "<a href='https://www.google.com/maps/dir/?api=1&amp;?saddr=My+Location&amp;destination=" + popupLoc[1] + "," + popupLoc[0] + "' target='_blank'><button class='btn btn-secondary btn-sm' ><i class='fas fa-external-link-alt'></i>&nbsp;Directions</button></a>";
          popupTxt += "<button class='btn btn-secondary btn-sm' style='float:right;' onclick='cozMAP.exportTableToCSV()'>Export Table</button>"
          
          if (document.getElementById('modal-popup-body')) {
            var modalPopupBody = document.getElementById('modal-popup-body')
          } else {
            var modalPopupBody = "";
          }
          if (modalPopupBody) {
            modalPopupBody.innerHTML = popupTxt;
          }

          if (window.innerWidth > 768) {
            setTimeout(function () {
              infoWindow.innerHTML = popupTxt;
              infoWindow.parentElement.style.display = "block";
              if (callback) {
                callback()
              }
              // new mapboxgl.Popup()
              //   .setLngLat(popupLoc)
              //   .setHTML(popupTxt)
                  //  .on('close', function () {
              //     highlightReset(map)
                  // console.log(selectedSourceLayer)
                  // if (internalTiles.indexOf(selectedSourceLayer) > -1) {
                  //   console.log('using feature-state')
                  //   map.setFeatureState({
                  //     source: selectedSource,
                  //     sourceLayer: selectedSourceLayer,
                  //     id: selectedLayerId
                  //   }, {
                  //     'hover': 0
                  //   })
                  // }

                  // selectedOnMap = false;

                  // if (typeof map.getLayer('selected') != "undefined") {
                  //   map.setFilter('selected', ['==', 'vtlid', '']);
                  //   map.removeLayer('selected')
                  // }
                //   if (selectedOnMap === false) { 
                //     window.history.replaceState({}, "", window.location.protocol + "//" + window.location.host + window.location.pathname + window.location.hash);
                //   }
                // })
                // .addTo(map);
            }, 10);
          } else {
              window.location.hash = "modal-popup";
              if (callback) {
                callback()
              }
            }
        }, 0)
      }
    }
  }
}

/**
 * Select features on map load
 * @param {*} map 
 */

function mapSelectOnLoad(map) {
  var mapQuery = getQuery((window.location.search).substring(1));
  console.log(mapQuery)
  if (mapQuery && mapQuery.layers && mapQuery.lng && mapQuery.lat) {
    var lngLat = {lng:Number(mapQuery.lng), lat:Number(mapQuery.lat)};
    var layers = [mapQuery.layers]
    
    var checkLoaded;
    var checking = 0;

    map.on('sourcedataloading', function (e) {
      if (checking === 0) {
        checkLoaded = setInterval(loaded, 500);
        console.log('checking if layer is loaded');
      }
      checking = 1
    });

    function loaded() {
      console.log("checking")
      if (map.areTilesLoaded() && (typeof map.getLayer(layers[0]) != "undefined")) {
        window.clearInterval(checkLoaded);
        console.log('selecting feature');
        map.fire('click', {lngLat: lngLat})
      }
    }
  }
}

function exportTableToCSV() {
  var csv = [];

  var rows = document.querySelectorAll("table tr");

  for (var i = 0; i < rows.length; i++) {
    var row = [],
      cols = rows[i].querySelectorAll("td, th");

    for (var j = 0; j < cols.length; j++)
      row.push(cols[j].innerText);

    csv.push(row.join(","));
  }

  // Download CSV file
  downloadCSV(csv.join("\n"), "feature-data.csv");
}

function downloadCSV(csv, filename) {
  var csvFile;
  var downloadLink;

  // CSV file
  csvFile = new Blob([csv], {
    type: "text/csv"
  });

  if (window.navigator.msSaveOrOpenBlob) {
    window.navigator.msSaveOrOpenBlob(csvFile, filename);
    return
  }

  // Download link
  downloadLink = document.createElement("a");

  // File name
  downloadLink.download = filename;

  // Create a link to the file
  downloadLink.href = window.URL.createObjectURL(csvFile);

  // Hide download link
  downloadLink.style.display = "none";

  // Add the link to DOM
  document.body.appendChild(downloadLink);

  // Click download link
  downloadLink.click();
}

/*
end select and update features based no url parameters
*/


function ifExists(url) {
  var http = new XMLHttpRequest();

  http.open('HEAD', url, false);
  http.send();
  var status = (http.status === 404) ? false : true;
  return status

}

/** TO DO MOVE TO HELPERS FILE
 * disable printing to the console unless debug=true is a url parameter, depends on getQuery()
 */

(function disableConsoleLog() {
  var cozParams = getQuery((window.location.search).substring(1));
  /*
  disable console.log debugging if debug is false
  */
  if (cozParams && cozParams.debug) {
    var debug = cozParams.debug;
  } else {
    var debug = false
  }
  if (debug === "true" || localStorage.getItem('debug') === "1") {} else {
    if (!window.console) window.console = {};
    var methods = ["log", "debug", "warn", "info"];
    for (var i = 0; i < methods.length; i++) {
      console[methods[i]] = function () {};
    }
  }
})();

export {
  mapAddControls,
  getFeature,
  mapGetInfo,
  highlight,
  highlightReset,
  highlightFeatureState,
  mapPrint,
  mapCheckLoading,
  mapSelectOnLoad,
  token,
  ifExists,
  mapillaryToken,
  exportTableToCSV,
  maxBounds
}