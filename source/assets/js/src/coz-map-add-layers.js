// import {LayerTree} from './coz-layer-tree.js';
import {getJSON} from './coz-helpers';
import {getQuery} from './coz-helpers';
import {updateQueryStringParam} from './coz-helpers';

/**
 * function to check if map is done rendering, make sure to call after all layers are added
 * This does not seem to work as well as the mapCheckLoading script
 * @param {*} map 
 */

function mapCheckRendered(m) {
  m.on('render', mapCheckRender);
  function mapCheckRender() {
    if (!m.loaded()) { return }

    var mapIsRendered = (typeof (Event) === 'function') ? new Event('mapIsRendered') : new CustomEvent('mapIsRendered')

    document.dispatchEvent(mapIsRendered);

    console.log('map render complete');

    m.off('render', mapCheckRender);
  }
}

/**
 * Gatrell Group layer tree helper function to create the layer tree json data
 * @param {*} map 
 * @param {*} obj 
 * @param {*} dr 
 * @param {*} lt 
 * @param {*} id id of the element where to place the layer tree
 */

// function mapCreateLayerTree(map, obj, dr, lt, id) {
//   console.log('layertree fired')

//   if (!dr) {
//     let dr = []
//   }

//   if (!lt) {
//     lt = []
//   } 

//   console.log(dr);

//   var divId = id ? id : 'coz-sidebar--layerControl';

//   for (var l in obj) {
//     // console.log(obj[l])
//     if (obj[l].directory) {
//       // dr.push({
//       //   "name": obj[l]["directory"]
//       // });
//     }
//     if (obj[l].name && obj[l].directory && !obj[l].layerGroup) {
//       // console.log('single layer added to tree: ' + obj[l].name)
//       lt.push({
//         "name": obj[l].name,
//         "source": obj[l].source,
//         "id": obj[l].id,
//         "directory": obj[l].directory
//       })
//     }
//     if (obj[l].name && obj[l].directory && obj[l].layerGroup) {
//       // console.log('group layer added to tree: ' + obj[l].name)
//       lt.push({
//         "name": obj[l].name,
//         "id": obj[l].id,
//         "layerGroup": obj[l].layerGroup,
//         "directory": obj[l].directory,
//         "hideLabel": obj[l].hideLabel
//       })
//     }
//   }
//   // console.log(lt)
//   var layerList = new LayerTree({
//     layers: lt,
//     directoryOptions: dr
//   });

//   // var layerListMobile = new LayerTree({
//   //   layers: lt,
//   //   directoryOptions: dr
//   // });

//   // map.addControl(layerListMobile, 'top-left');

//   var layerControlDivId = document.getElementById(divId);
//   layerControlDivId.appendChild(layerList.onAdd(map));
// }

/**
 * 
 * @param {*} map 
 * @param {object} layers an object containing the layers for the map 
 */

function mapAddLayers(map, layers, options) {
  if (!hasWebp()) {
    layers.forEach(l => {
      if (l.sourceType && l.sourceType.tiles) {
        l.sourceType.tiles[0] = l.sourceType.tiles[0].replace(".webp", ".png")
      }
    })
  }

  function loopLayers(layer, options) {
    var l = layer;

    if (l.source && l.sourceType && l.sourceType.type === "geojson" && options && options.lazyLoading) {
      if (l.metadata && l.metadata.lazyLoading === false) {
        //skip if false
      }else{
        if (!l.metadata) l.metadata = {}
        l.metadata.lazyLoading = true
        l.metadata.source = {
          id: l.source,
          type: l.sourceType.type,
          data: l.sourceType.data
        }
        l.sourceType.data = {
          type: "FeatureCollection",
          features: []
        }
      }
    }

    if (l.sourceType) {
      if (!map.getSource(l.source)) {
        map.addSource(l.source, l.sourceType)
      }
    }
    if (!l.top && !l.backgroundLayer) {
      if (map.getLayer('road-label') && !map.getLayer(l.id)) {
        map.addLayer(l, "road-label");
      }
      else if (map.getLayer('waterway-label') && !map.getLayer(l.id)) {
        map.addLayer(l, "waterway-label");
      }
      else if (map.getLayer('water_name_line') && !map.getLayer(l.id)) {
        map.addLayer(l, "water_name_line");
      }
      else if (map.getLayer('waterway-name') && !map.getLayer(l.id)) {
        map.addLayer(l, "waterway-name");
      }
      else if (!map.getLayer('water_name_line') && !map.getLayer('waterway-label') && !map.getLayer('waterway-name') && !map.getLayer(l.id)) {
        map.addLayer(l)
      }
    } 
    if (l.top == true) {
      map.addLayer(l)
    }
    if (l.backgroundLayer) {
      if (map.getLayer('water')) {
        map.addLayer(l, 'water')
      }else{
        l.backgroundLayer = false;
        loopLayers(l)
      }
    }
    map.on('mouseenter', l.id, function () {
      map.getCanvas().style.cursor = 'crosshair';
    });
    map.on('mouseleave', l.id, function () {
      map.getCanvas().style.cursor = '';
    });
  }

  for (var layer in layers) {
    var l = layers[layer];

    if (l.layerGroup) {
      // console.log('group')
      for (var newLayer in l.layerGroup) {
        // console.log(newLayer)
        loopLayers(l.layerGroup[newLayer], options)
      }
    } else {
      // console.log('single')
      loopLayers(layers[layer], options)
    }
  }

  return layers
}

function hasWebp() {
  var elem = document.createElement('canvas');

  if (!!(elem.getContext && elem.getContext('2d'))) {
    // was able or not to get WebP representation
    return elem.toDataURL('image/webp').indexOf('data:image/webp') == 0;
  } else {
    // very old browser like IE 8, canvas not supported
    return false;
  }
}

function buildMapLayersObject(layer, master, layers) {
  for (let newImportLayer in master) {
    if (master[newImportLayer].id === layer) {
      layers.push(master[newImportLayer])
    }
  }
}

/**
 * 
 * @param {*} map 
 * @param {*} importLayers 
 * @param {*} json 
 * @param {*} divId 
 */

// function initMapLayers(map, importLayers, json, divId) {
//   var div = (!divId) ? 'coz-sidebar--layerControl' : divId;
//   var mapLayers = [],
//   directoryOptions = [],
//   layerTreeLayers = [];

//   if (!json) {
//     getJSON('/assets/map-layers.json', function (data) {
//       console.log('received map layers json');
//       var theseLayers;
//       if (!importLayers) {
//         theseLayers = [];
//         data.map(function (l,i) {
//           theseLayers.push(l.id)
//         });
//       }else{
//         theseLayers = importLayers;
//       }
//       for (var i in theseLayers) {
//         buildMapLayersObject(theseLayers[i], data, mapLayers)
//       }
//       mapCreateLayerTree(map, mapLayers, directoryOptions, layerTreeLayers, div)
//       mapAddLayers(map, mapLayers);
//       mapCheckRendered(map);
//     });
//   }else{
//     mapCreateLayerTree(map, json, directoryOptions, layerTreeLayers, div)
//     mapAddLayers(map, json);
//     mapCheckRendered(map);
//   }
// }


/**
 * function to check the url query parameters for layers to turn on or off, then toggle on or off the layer legends
 * fire this after mapIsRendered is fired
 */

// function mapCheckToggleLayers() {
//   console.log('mapCheckToggleLayers has initiated')
//   var mapQuery = getQuery((window.location.search).substring(1));
//   if (mapQuery) {
//     console.log(mapQuery);
//     var loading2 = document.getElementById('loading-blank');
//     loading2.classList.add('loading');
//     setTimeout(function() {
//       for (var key in mapQuery) {
//         if (key.startsWith('layer_')) {
//           var keyId = key.replace('layer_', '');
//           var div = document.getElementById(keyId);

//           if (div != null && div.children[0].children[0].checked.toLocaleString() != mapQuery[key]) {
//             div.children[0].click();
//             // console.log("adjusting", keyId, "layer");
//             if (div.parentElement.getElementsByClassName("toggle-directory-open")) {
//               div.parentElement.children[0].click()
//             }
//           }
//         }
//       }
//       initLayerTreeToggleLegend();
//       loading2.classList.remove('loading');
//     }, 10)
//   }else{
//     setTimeout(function() {
//       initLayerTreeToggleLegend();
//     }, 10);
//   }

//   var layerControlLayers = document.getElementsByClassName('toggle-layer');
//   for (var i=0; i < layerControlLayers.length; i++) {
//     layerControlLayers[i].addEventListener('click', function() {
//       var checked = (this.checked == true) ? 'true' : 'false';
//       var layerName = 'layer_' + this.id.slice(0,-1);
//       updateQueryStringParam(layerName,checked);
//     });
//   }      
// }

// document.addEventListener('mapIsRendered', function() {
//   mapCheckToggleLayers()
// });

/**
 * Toggle the legends in the layer tree when the layers are turned on
 */
var checkedToggleLayers = 0;
// function initLayerTreeToggleLegend() {
//   var items = document.getElementsByClassName('toggle-layer');
//   if (items.length === 0 && checkedToggleLayers < 6) {
//     setTimeout(function() {
//       console.log('initial layer tree toggle failed, checking again in 5 seconds...')
//       initLayerTreeToggleLegend();
//       checkedToggleLayers = checkedToggleLayers + 1;
//     }, 5000)
//     return
//   }
//   if (items.length > 0) {
//     console.log('initLayerTreeToggleLegend');
//     for (let i=0; i<items.length;i++) {
//       console.log(items[i].checked)
//       /* check if the legend for child layers is being shown and if not show it*/
//       if (items[i].checked === true) {
//         layerTreeToggleLegend(items[i])
//       }
//       /* add the legend toggle for the child layers listener*/
//       items[i].addEventListener('change', function() {
//         layerTreeToggleLegend(this)
//       })
//     }
//   }
// }

if (!Element.prototype.matches) {
  Element.prototype.matches = Element.prototype.msMatchesSelector ||
    Element.prototype.webkitMatchesSelector;
}

if (!Element.prototype.closest) {
  Element.prototype.closest = function (s) {
    var el = this;

    do {
      if (el.matches(s)) return el;
      el = el.parentElement || el.parentNode;
    } while (el !== null && el.nodeType === 1);
    return null;
  };
}

function layerTreeToggleLegend(el) {
  var layerIsVisible = el.checked === true ? true : false;

  var parent = el.parentElement.parentElement;
  var children = parent.querySelectorAll('.child-layer');

  if (layerIsVisible === true) {
    parent.classList.add("active")
  }else{
    parent.classList.remove("active")
  }

  for (var j = 0; j < children.length; j++) {
    if (layerIsVisible && !children[j].classList.contains('child-layer-show')) {
      children[j].classList.add('child-layer-show');
    }
    if (!layerIsVisible && children[j].classList.contains('child-layer-show')) {
      children[j].classList.remove('child-layer-show');
    }
  }

  var layerDirectory = parent.closest(".layer-directory");
  var layerItems = layerDirectory.getElementsByClassName("layer-item")
  var layersActive = 0;

  for (let i = 0; i < layerItems.length; i++) {
    if (layerItems[i].classList.contains("active")) {
      layersActive = layersActive + 1;
      layerDirectory.classList.add("badge")
      layerDirectory.setAttribute("data-badge", layersActive)
    }
    if (layersActive === 0) {
      layerDirectory.classList.remove("badge")
    }
  }

  var directory = el.parentElement.parentElement.parentElement;
  directory.style.maxHeight = "unset";
}

// export { 
//   initMapLayers, 
//   mapCreateLayerTree, 
//   mapCheckToggleLayers,
//   mapAddLayers,
//   mapCheckRendered
//   }

export { 
  mapAddLayers,
  mapCheckRendered
}