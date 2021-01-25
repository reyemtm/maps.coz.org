import { mapAddLayers } from "./coz-map-add-layers";
import { layerControlGrouped } from '../../../../mapbox-layer-control/src/layerControlGrouped.js';
import { popup, getFeatures } from './coz-popup';
import { mapAddControls } from "./coz-map-misc-functions.js";
import { getQuery, updateQueryStringParam } from "./coz-helpers.js";
import { OpenLocationCode } from "open-location-code";
import { mapCheckLoading } from "./coz-mapCheckLoading.js";

const styles = {
  "streets": "mapbox://styles/cozgis/cjoyj0loid3mp2rpb6eczup77",
  "dark": "mapbox://styles/mapbox/dark-v9"
}

class Map {
  constructor(opts) {
    this._container = (!opts.container) ? 'map' : opts.container;
    this._hash = true,
    this._style = (!opts.style) ? styles["streets"] : styles[opts.style],
    this._center = [-82.00754,39.9422],
    this._minZoom = 14
    this._maxZoom = 22
    this._preserveDrawingBuffer = true,
    this._mbToken = 'pk.eyJ1IjoiY296Z2lzIiwiYSI6ImNrNHloMzJwdDAwajYza3BhZWdwcGttNGwifQ.M87K4AluzE_Ijzda7CJgTw';
    this._layerConfig = (!opts.layerConfig) ? [] : opts.layerConfig,
    this._controls = (!opts.controls || opts.controls === false) ? false : true,
    this._callback = (!opts.callback) ? false : opts.callback
  }

  init(url) {
    mapboxgl.accessToken = this._mbToken;
    var config = this._layerConfig;
    var url = (url) ? url : "/map-layers-config.json";
    fetch(url)
    .then(res => {
      return res.json()
    })
    .then(data => {
      var layers = data.filter(function(layer) {
        return config.indexOf(layer.id) > -1 || config.indexOf(layer.directory) > -1
      });
      var controls = this._controls;

      var callback = this._callback;

      this._map = new mapboxgl.Map({
        container: this._container,
        hash: true,
        style: this._style,
        center: [-81.9981, 39.9657],
        zoom: 14,
        minZoom: 10,
        maxZoom: 22,
        preserveDrawingBuffer: true
      });

      mapCheckLoading(this._map, function(e) {
        var plcode = {};
        plcode.query = getQuery();
        if (plcode.query && plcode.query.pluscode) {
          plcode.fn = new OpenLocationCode();
          plcode.coords = plcode.fn.decode(plcode.query.pluscode);
          console.log(plcode.coords)
          if (plcode.coords) {
            e.flyTo({
              center: [plcode.coords.longitudeCenter, plcode.coords.latitudeCenter],
              zoom: 17
            })
            .once("zoomend", function() {
              var ids = layers.reduce((i,l) => {
                return [...i, l.id]
              }, []);
              if (document.querySelector("#loading")) {
                document.querySelector("#loading").classList.remove("loading")
              }
              popup(e, getFeatures(e, {lngLat: [plcode.coords.longitudeCenter, plcode.coords.latitudeCenter]}, ids));
            })

          }else{
            if (document.querySelector("#loading")) {
              document.querySelector("#loading").classList.remove("loading")
            }
          }
        }else{
          if (document.querySelector("#loading")) {
            document.querySelector("#loading").classList.remove("loading")
          }
        }
      })

      this._map.on('load', function() {
       
        mapAddLayers(this, layers);

        /* TODO ADD FUNCTION THAT LOOPS THROUGH ALL LAYERS AND ADDS CLICK HANDLER IE POPUP FOR EACH LAYER
        SOMETHING LIKE
        var thisMap = this;
        layers.map(layer => {
          thisMap.on("click", layer, layer.popup)
        })

        OR SOMETHING LIKE THAT WOULD BE NICE TO HAVE SOMETHING SIMPLE LIKE A TEMPLATE LANGUAGE HERE */

        var lc = new layerControlGrouped({
          options: {
            collapsed: false
          },
          layers: layers
        });
        document.querySelector("#coz-sidebar--layerControl").appendChild(lc.onAdd(this));

        if (controls) {
          mapAddControls(this);
        }

      }).on("click", function(e) {
        var ids = layers.reduce((i,l) => {
          return [...i, l.id]
        }, [])
        popup(this, getFeatures(this, e, ids));
        
        if (callback) {
          callback(e)
        }

      })
    });

  }
}

export {
  Map
}