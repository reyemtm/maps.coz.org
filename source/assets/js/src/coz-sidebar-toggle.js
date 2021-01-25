/**
 * Custom Mapbox control to toggle the sidebar with hard-coded div ids and classes
 * @param {object} map mapbox map object
 */
function cozSidebarToggleControl() {

  this.onAdd = function (map) {
    var _id = "sidebarId"
    this._map = map;
    this._btn = document.createElement('button');
    this._btn.id = "mapSidebarToggle";
    this._btn.className = 'fa fa-bars fa-2x';
    this._btn.type = 'button';
    this._btn['aria-label'] = 'Toggle Sidebar';
    this._btn.onclick = function () {
      var _mapSidebar = document.getElementById(_id);
      var _mapContainers = document.getElementsByClassName('mapboxgl-map');
      if (_mapSidebar.classList.contains('active')) {
        _mapSidebar.classList.remove('active');
        for (var m = 0; m < _mapContainers.length; m++) {
          _mapContainers[m].classList.remove('coz-map--sidebar-active')
        }
        map.resize();
      } else {
        _mapSidebar.classList.add('active');
        for (var m = 0; m < _mapContainers.length; m++) {
          _mapContainers[m].classList.add('coz-map--sidebar-active')
        }
      }
    };

    this._container = document.createElement('div');
    this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
    this._container.appendChild(this._btn);

    return this._container;
  }
  this.onRemove = function () {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }
}

export {
  cozSidebarToggleControl
};