var sitePlans, featureStateId;

//////////////////////////////////
//IMPORTS ARE RELATIVE TO WHERE THE PAGE ON WHICH THE APP IS LOADED WHICH IS WHY THESE ARE ALL RELATIVE LINKS
//////////////////////////////////

import {
  layerControlGrouped
} from "../vendor/mapbox-layer-control-master/layerControlGrouped.js"

import {
   mglHighlightFeatureState
} from '../assets/mglHighlightFeatureState.js'

import {
  mglLoading
} from '../assets/mglLoading.js'

import {
  mglAddIcons
} from '../assets/mglAddIcons.js'

Promise.all([
  fetch("../get-table?table=eng_site_plans&format=geojson", {
    cache: "reload"
  }),
  fetch("https://gis.coz.org/map-layers-config.json"),
  fetch("../assets/mapillary-icons/mapillary-icons.json")
])
.then(res => {
  Promise.all(res.map(r => r.json()))
    .then(data => {
      initMap(data)
    })
})
.catch(err => {
  alert("An error has occurred receiving the map data. Please refersh your browser. If the error persists contact GIS.\n", err);
  console.log(err)
})

function initMap(data) {

  console.log(sitePlans)

  var mask = {
    "id": "admin-mask",
    "type": "fill",
    "directory": "Administrative Layers",
    "group": "Administrative Boundaries",
    "name": "City Mask",
    "children": true,
    "source": "adminSource",
    "sourceType": {
      "type": "vector",
      "tiles": ["https://311.coz.org/data/vt/adm_admin_boundaries/{z}/{x}/{y}.mvt"],
      "maxzoom": 17
    },
    "source-layer": "adm_admin_boundaries",
    "paint": {
      "fill-color": "whitesmoke",
      "fill-opacity": 0.99
    },
    "layout": {
      "visibility": "none"
    },
    "filter": ["!=", ["get", "name"], "ZANESVILLE"]
  }

  var maskOutline = {
    "id": "admin-mask-outline",
    "type": "line",
    "parent": "admin-mask",
    "hidden": true,
    "directory": "Administrative Layers",
    "group": "Administrative Boundaries",
    "name": "City Mask 2",
    "children": true,
    "source": "adminSource",
    "sourceType": {
      "type": "vector",
      "tiles": ["https://311.coz.org/data/vt/adm_admin_boundaries/{z}/{x}/{y}.mvt"],
      "maxzoom": 17
    },
    "source-layer": "adm_admin_boundaries",
    "paint": {
      "line-color": "black",
      "line-width": 4
    },
    "layout": {
      "visibility": "none"
    },
    "filter": ["==", ["get", "name"], "ZANESVILLE"]
  }

  var sitePlansLayer = {
    "id": "sitePlans",
    "type": "fill",
    "directory": "Administrative Layers",
    "name": "Site Plans",
    "children": true,
    "source": "sitePlans",
    "sourceType": {
      "type": "geojson",
      "data": sitePlans
    },
    "paint": {
      "fill-color": "blue",
      "fill-outline-color": "white",
      "fill-opacity": 0.3
    },
    "layout": {
      "visibility": "none"
    }
  }

  var sitePlansOutline = {
    "id": "sitePlansOutline",
    "type": "line",
    "parent": "sitePlans",
    "hidden": true,
    "directory": "Administrative Layers",
    "name": "Site Plans",
    "source": "sitePlans",
    "sourceType": {
      "type": "geojson",
      "data": sitePlans
    },
    "paint": {
      "line-color": "blue",
      "line-width": 5
    },
    "layout": {
      "visibility": "none"
    }
  }

  data[1].push(mask)
  data[1].push(maskOutline)
  data[1].push(sitePlansLayer)
  data[1].push(sitePlansOutline)


  var layers = data[1].filter(d => {
    return  d["directory"] === "Impervious Surface" || d["directory"] === "Administrative Layers" || d["directory"] === "Imagery" || d["directory"] === "City Sewer System"
  })

  layers.push({
    id: "mapillary",
    type: "symbol",
    group: "Mapillary",
    directory: "Mapillary",
    name: "Mapillary Point Detections",
    "children": true,
    source: "mapillary",
    sourceType: {
      type: "vector",
      tiles: [ "https://a.mapillary.com/v3/map_features?tile={z}/{x}/{y}&client_id=V3B6aHlRZVdMUG5aX1R3dnhjZFVfdzo4YmEwZjY1Mjg2ZTNhYzQ2&layers=points"],
      attribution: "<a href='https://www.mapillary.com'>Mapillary</a>, CC BY",
      minzoom: 12,
      maxzoom: 17
    },
    "source-layer": "mapillary-points",
    "filter": ["all",
      ["!=", ["get", "value"], "construction--flat--driveway"],
      ["!=", ["get", "value"], "object--sign--advertisement"],
      ["!=", ["get", "value"], "object--sign--store"],
      ["!=", ["get", "value"], "object--support--utility-pole"]

    ],
    layout: {
      "icon-image": "{value}",
      "icon-allow-overlap": true,
      visibility: "none"
    }
  })

  layers.push({
      "id": "mapillaryLabels",
      "directory": "Mapillary",
      "group": "Mapillary",
      "type": "symbol",
      "parent": "mapillary",
      "hidden": true,
      "name": "Mapillary Labels",
      "source": "mapillary",
      "source-layer": "mapillary-points",
      "paint": {
        "text-color": "black",
        "text-halo-color": "white",
        "text-halo-width": 2,
        "text-halo-blur": 0
      },
      "layout": {
        "visibility": "none",
        "text-font": ["DIN Offc Pro Bold"],
        "text-field": "{value}",
        "text-anchor": "bottom-left",
        "text-size": 14,
        "text-offset": [0.5, -0.2]
      },
      "filter": ["all",
        ["!=", ["get", "value"], "construction--flat--driveway"],
        ["!=", ["get", "value"], "object--sign--advertisement"],
        ["!=", ["get", "value"], "object--sign--store"],
        ["!=", ["get", "value"], "object--support--utility-pole"]

      ],
    })
  
  layers.push({
    "id": "mapillary-signs",
    "name": "Mapillary Signs",
    "group": "Mapillary",
    "directory": "Mapillary",
    "children": true,
    "type": "circle",
    source: "mapillary-signs",
    sourceType: {
      type: "vector",
      tiles: ["https://a.mapillary.com/v3/map_features?tile={z}/{x}/{y}&client_id=V3B6aHlRZVdMUG5aX1R3dnhjZFVfdzo4YmEwZjY1Mjg2ZTNhYzQ2&layers=trafficsigns"],
      attribution: "<a href='https://www.mapillary.com'>Mapillary</a>, CC BY",
      minzoom: 12,
      maxzoom: 17
    },
    "source-layer": "mapillary-trafficsigns",
    "paint": {
      "circle-color": "red",
      "circle-radius": 6,
      "circle-stroke-color": "white",
      "circle-stroke-width": 2
    },
    "layout": {
      "visibility": "none"
    }
  })

  layers.push({
    "id": "mapillary-signs-labels",
    "name": "Mapillary Sign Detections",
    "group": "Mapillary",
    "directory": "Mapillary",
    "hidden": true,
    "parent": "mapillary-signs",
    "type": "symbol",
    "minzoom": 16,
    source: "mapillary-signs",
    sourceType: {
      type: "vector",
      tiles: ["https://a.mapillary.com/v3/map_features?tile={z}/{x}/{y}&client_id=V3B6aHlRZVdMUG5aX1R3dnhjZFVfdzo4YmEwZjY1Mjg2ZTNhYzQ2&layers=trafficsigns"],
      attribution: "<a href='https://www.mapillary.com'>Mapillary</a>, CC BY",
      minzoom: 12,
      maxzoom: 17
    },
    "source-layer": "mapillary-trafficsigns",
    "paint": {
      "text-color": "black",
      "text-halo-color": "white",
      "text-halo-width": 2,
      "text-halo-blur": 0
    },
    "layout": {
      "visibility": "none",
      "text-font": ["DIN Offc Pro Bold"],
      "text-field": "{value}",
      "text-anchor": "bottom-left",
      "text-size": 14,
      "text-offset": [0.5, -0.2]
    },
  })

  mapboxgl.accessToken = 'pk.eyJ1IjoiY296Z2lzIiwiYSI6ImNqZ21lN2R5ZDFlYm8ycXQ0a3R2cmI2NWgifQ.z4GxUZe5JXAdoRR4E3mvpg' //TODO turn this whole thing into a route and move this to the env file

  var map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/cozgis/cjvpkkmf211dt1dplro55m535', // stylesheet location
    center: [-82.014, 39.942], // starting position [lng, lat]
    zoom: 15, // starting zoom
    minZoom: 14,
    hash: true
  })

  //////////////////////////////////
  // USE THE LOADING FUNCTION TO ADD A LOADING ICON WHENEVER THERE IS A RENDER EVENT ON THE MAP, AND REMOVE WHEN THE MAP IS LOADED
  //////////////////////////////////
  // mglLoading(map, "loading", "loading")
  
  map.on('load', function () {
    mglAddIcons(map, data[2], function() {
      next()
    })
  });

  function next() {
    document.querySelector("#loading").classList.remove("loading")
    //////////////////////////////////
    //ADD SOURCES, LAYERS AND LAYER CONTROL USING CUSTOM GROUPEDLAYERCONTROL
    //////////////////////////////////
    layers.map(layer => {
      if (layer.sourceType && (!map.getSource(layer.source))) map.addSource(layer.source, layer.sourceType)
    })
    layers.map(layer => {
      map.addLayer(layer)
    })
    var config = {
      options: {
        collapsed: true
      },
      layers: layers
    };
    map.addControl(new layerControlGrouped(config), "top-left");
    
    //////////////////////////////////
    // INIT HIGHLIGHT FUNCTION
    //////////////////////////////////
    layers.map(layer => {
      if (layer.id === "adm_mus_parcels") mglHighlightFeatureState(map, layer, layer.sourceType)
    })    

    //////////////////////////////////
    //ADD MAPBOX GEOCODER ADDRESS SEARCH
    //////////////////////////////////
    var geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      placeholder: "Address Search"
    });

    map.addControl(geocoder, 'top-right')
    //////////////////////////////////
    
    //////////////////////////////////
    //ADD HELP WINDOW WELCOME MESSAGE
    //////////////////////////////////
    map.addControl(new mglMessageButton({
      title: 'Site Plans',
      message: 'This app updates the site plans table. Writes to this app will be published the following day. If you have any questions please contact GIS.'
    }), 'top-right')

    //////////////////////////////////
    //ADD MAP CLICK LISTENER
    //////////////////////////////////
    map.on("click", function (e) {
      console.log(map.queryRenderedFeatures(e.point))
      clickListener(map, e, sitePlans)
    })
    //
    
    //////////////////////////////////
    //REMOVE POPUP AND HIGHLIGHT ON RIGHT CLICK - HIGHLIGHT IS CLEARED WHEN MAP CLOSE BUTTON IS CLICKED
    //////////////////////////////////
    map.on("contextmenu", function() {
      if (document.querySelector(".mapboxgl-popup-close-button")) document.querySelector(".mapboxgl-popup-close-button").click()
    })
    //

    //////////////////////////////////
    //ADD SUBMIT LISTENER TO FORM, PASSING IN THE map OBJECT
    //////////////////////////////////
    inputFormModalSubmitListener(map, sitePlans)
  }

}

/**
 * 
 * @param {*} map map instance
 * @param {*} e clicked point
 * @param {*} table zoning table to pull properties from
 */
function clickListener(map, e, table) {
  inputFormModalReset(document.querySelector("form"));

  var popup = new mapboxgl.Popup();

  var parcel = map.queryRenderedFeatures(e.point, {layers: ["adm_mus_parcels"]});
  console.log(parcel)
  if (parcel && parcel.length) {

    var features = map.querySourceFeatures('parcelSource', {
      sourceLayer: "public.adm_mus_parcels",
      filter: ["==", "parcelnum", parcel[0].properties.parcelnum]
    });
  
    if (features && features.length) {

      featureStateId = features[0].id;

      console.log(featureStateId)

      //GET THE VALUES TO POPULATE THE POPUP MODAL FROM THE ZONING TABLE - THESE VALUES WILL CHANGE, OPTIONALLY THESE VALUES COULD COME FROM THE DATABASE ITSELF
      var props = [];
      table.features.forEach(t => { 
        if(t.properties.parcelnum === features[0].properties.parcelnum) {
          props.push(t.properties)
        }
      });

      console.log("existing feature found:", props)

      //GET PARCEL NUMBER AND PARCEL ADDRESS FROM PARCEL TO FILL IN IF NOTHING IS FOUND IN THE ZONING TABLE
      if (props.length === 0) {
        props[0] = {
          id: 0,
          parcelnum: features[0].properties.parcelnum,
          address: features[0].properties.location_address,
          edit_date: new Date(),
          owner: features[0].properties.owner_contact_name,
          x: Number(features[0].properties.inside_x),
          y: Number(features[0].properties.inside_y)
        }
        if (props[0].parcelnum === "WW" || props[0].parcelnum === "RR" || !props[0].parcelnum || props[0].parcelnum === undefined || props[0].parcelnum == "9") return

        popup
        .setLngLat(e.lngLat)
        .setHTML(formatProps(props[0]))
        .addTo(map);
      }else{

        //LET THE DB KNOW THAT THIS HAS BEEN UPDATED ON THE CLIENTSIDE
        if (props[0].id === "0") props[0].id = -1;

        props[0].owner = features[0].properties.owner_contact_name;
        inputFormModalSetValues(props[0]);

        //SHOW POPUP FIRST WITH DATA AND ADD LINK TO SHOW INPUT MODAL FOR DATA
        popup
        .setLngLat(e.lngLat)
        .setHTML(formatProps(props[0]))
        .addTo(map);

        console.log(props)

      }
      //SET VALUES OF MODAL TO POPERTIES OF EITHER NEW ZONING RECORD OR EXISTING
      inputFormModalSetValues(props[0]);

    }
  }

  function formatProps(props) {
    return `
    ${Object.keys(props).map(function(key) {
      // console.log(props[key])
      if (key === "geom") return ''
      return `
          <div class="bg-secondary">
            <strong>${key.split("_").join(" ").toUpperCase()}</strong>
          </div>
          <div>
            ${(!props[key]) ? "&nbsp" : (props[key] === "") ? "&nbsp" : (key === "parcelnum") ? `<a href="https://www.muskingumcountyauditor.org/Data.aspx?ParcelID=${props[key]}">${props[key]}</a>` : props[key] }
          </div>`
    }).join(" ")}
    <br><a href="#inputFormModal"><button class="btn btn-sm btn-outline btn-red" style="width:100%" onclick="document.querySelector('.mapboxgl-popup-close-button').click()"><icon class="icon icon-edit"></icon> EDIT/ADD SITE PLAN</button></a>
    `
  }

}

/**
 * Function for submitting the data to the database via the Node App using URLSearchParams to grab the data fron the form
 * If the ID is greater than 0 then the app will update the data, otherwise the app will insert a new record
 * @param {*} map 
 * @param {*} table 
 */
function inputFormModalSubmitListener(map, table) {
  var form = document.querySelector("form");
  if (!form) {
    console.error("no form found!")
  } else {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      //ADD LOADING ONCE FORM IS OPENED
      document.querySelector("#loading").classList.add("loading")

      var data = new FormData(form);

      console.log(data)

      fetch('../site-plans', {
          method: 'post',
          body: data,
        })
        .then(res => {
          console.log(res)
          if (res.status === 200) {

            //////////////////////////////////
            //CLEAR THE MODAL FORM
            //////////////////////////////////
            inputFormModalReset(form);

            //////////////////////////////////
            //UPDATE THE GLOBAL ZONING TABLE
            //////////////////////////////////
            // sitePlans = globalStateUpdate(data, table);

            //////////////////////////////////
            //CHANGE THE MAP TO REFLECT THE ZONING TABLE
            //////////////////////////////////
            // console.log(data.get("zoning_code"), featureStateId)

            //////////////////////////////////
            //FINALLY CHANGE THE PAINT COLOR OF THE UNDERLYING PARCELS TO THE NEW GLOBALLY STORED ZONING TABLE
            //////////////////////////////////
            // map.setPaintProperty("adm_mus_parcels", "fill-color", zoningPaintExpression(zoningTable))

          } else {
            console.log(res)
            alert("The value did not submit properly. Close the modal window and try to select another line. If the error persists contact the site administrator.")
          }
        });
    })
  }
}

//////////////////////////////////
//CONVERT URLSearchParams to JSON OBJECT
//
//TODO MOVE TO HELPER IMPORT
//////////////////////////////////
function paramsToObject(entries) {
  let result = {}
  for(let entry of entries) {
    const [key, value] = entry;
    result[key] = value;
  }
  return result;
}

