
/**
 * 
 * @param {element} el html dom element
 * @param {string} cls string classname
 */
function getParent (el, cls) {
  while ((el = el.parentElement) && !el.classList.contains(cls));
  return el;
}

/**
 * Returns all the current map layers in an array
 * @param {*} map 
 */

function getLayers(map) {
  var _layers = [];

  var _currentLayers = map.getStyle().layers;

  _currentLayers.map(function(l) {
    _layers.push(l.id)
  })

  return _layers
}

/**
 * Check if a Mapbox GL JS map has a layer id in its current style
 * @param {object} map Mapbox GL map 
 * @param {string} layer string name of the layer id 
 */
function hasLayer(map, layer) {
  var layers = getLayers(map);
  var hasLayer = false;
  if (layers.indexOf(layer) > -1) hasLayer = true;

  return hasLayer;
}

/**
 * Update url parameters with a key and value pair
 * @param {string} key 
 * @param {string} value 
 */

function updateQueryStringParam(key, value) {
  var query = new URLSearchParams(window.location.search)
  if (!query.get(key)) {
    query.set(key, value)
  }
  if (!value && query.get(key) != undefined) {
    query.delete(key)
  }
  var search = (!query.toString().length) ? "" : "?" + query;
  var baseUrl = [location.protocol, '//', location.host, location.pathname].join('');
  window.history.replaceState({}, "", baseUrl + search + window.location.hash);
};

/** getJSON request function to use instead of fetch
 * 
 * @param {string} url 
 * @param {function} successHandler 
 */

function getJSON(url, successHandler) {
	var xhr = new XMLHttpRequest();
	xhr.open('get', url, true);
	xhr.onload = function() {
		var status = xhr.status;
		if (status == 200) {

			successHandler && successHandler(JSON.parse(xhr.responseText));
		} else {
      console.log(status);
      return null
		}
	};
	xhr.send();
}

/**
 * 
 * @param {object} q
 */
function getQuery(q) {
  var qry = (!q) ? (window.location.search).substring(1) : q
  if (qry) {
    var params = {},
      queries, temp, i, l;
    /* Split into key/value pairs*/
    queries = qry.split("&");
    /* Convert the array of strings into an object*/
    for (var i = 0, l = queries.length; i < l; i++) {
      temp = queries[i].split('=');
      params[temp[0]] = temp[1];
    }
    return params;
  }
};


function mglAddIcons(map, icons, callback) {
  var total = icons.length;
  icons.forEach(icon => {
    map.loadImage(icon.url, function (error, image) {
      if (error) {
        console.log({error, image});
      }else{
        map.addImage(icon.name, image);
        total = total - 1;
        if (!total) {
          console.log("icon loading complete!")
          callback()
        }
      }
    })
  })
}

function clearChildren(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}

export { 
  getParent, 
  updateQueryStringParam, 
  getJSON,
  getLayers,
  getQuery,
  hasLayer,
  clearChildren,
  mglAddIcons
};