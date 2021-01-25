/**
 * Function to check if the Mapbox map is done loading
 * @memberof cozMAP
 * @method mapCheckLoading
 * @events fires 'mapIsLoaded' event when the map is done loading and removes a 'loading' class on an id 'loading' if one exists
 * @param {object} map mapbox map object to check
 */

function mapCheckLoading(m, callback) {

  var mapIsLoaded = (typeof (Event) === 'function') ? new Event('mapIsLoaded') : new CustomEvent('mapIsLoaded')

  var _x = 0;
  var _checkLoadedInterval;

  //FIRE THIS FUNCTION ONLY ONCE, ON INITIAL MAP LOAD, THIS WILL TRIGGER AN EVENT TO THE MAP TO LET THE CLIENT KNOW THAT ALL THE LAYERS HAVE LOADED
  m.once('sourcedataloading', function (e) {
    if (_x === 0) {
      _checkLoadedInterval = setInterval(checkIfMapTilesAreLoaded, 500);
      console.log('map has started loading tiles');
      console.log('checkIfMapTilesAreLoaded is waiting for sourcedataloading to complete');
      // m._container.classList.add('d-invisible');
    }
    _x = 1
  });

  function checkIfMapTilesAreLoaded() {
    if (m.areTilesLoaded()) {
      window.clearInterval(_checkLoadedInterval);
      document.dispatchEvent(mapIsLoaded);
      console.log('sourcedataloading is complete, mapIsLoaded fired');
      _x = 0;    
    }
  }

  if (document.getElementById('loading')) {
    document.addEventListener('mapIsLoaded', function () {
      // if (sessionStorage.getItem('cozaccept')) {
        if (document.getElementById("loading")) {
          var newLoading = document.getElementById('loading');
          newLoading.classList.remove('loading');
        }
        if (callback) { callback(m) }
      // }
    });
  }
}

export {
  mapCheckLoading
}