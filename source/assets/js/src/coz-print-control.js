import {cozMapboxPrintSetup} from "./coz-mapbox-print-pdf";

function mapPrintControl() {
  this.onAdd = function (map) {
    this._map = map;
    var mapPrintControlMap = this._map;

    this._btn = document.createElement('button');
    // this._btnImg = document.createElement('img');
    // this._btnImg.src = "/assets/img/file-image-o.png";
    this._btn.id = "print-preview-button"; // this._btn.className = 'fa fa-image fa-2x';
    this._btn.className = 'fa fa-print fa-2x';
    this._btn.type = 'button';
    this._btn['aria-label'] = 'Print Map';
  
    this._counter = 0;

    this._btn.onclick = function () {
      if (!this._counter) {
        cozMapboxPrintSetup(mapPrintControlMap);
      }
      console.log("print button clicked")
      this._counter = 1;
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

export {
  mapPrintControl
};