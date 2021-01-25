/**
 * TODO add more console notifications
 * TODO add to blog post
 * TODO add requires that the geojson have an id at the feature.id level
 */

class networkControl {
  constructor(options) {

    console.log(options)

    const opts = options.options;

    const originPoints = (!options) ? {} : options.options.originPoints;
    const originNetwork = (!options) ? {} : options.options.linearNetwork;
    const originLayers = (!options) ? [""] : options.options.originLayers;
    const idField = (!options) ? "vtlid" : options.options.idField;

    var linearNetwork = {
      type: "FeatureCollection",
      features: []
    };
    linearNetwork.features = (originNetwork.features).slice(0)
    linearNetwork["name"] = "network";

    const blankGeoJSON = {
      type: "FeatureCollection",
      features: []
    }

    let networkTraceDirection = "upstream";

    var loadingTimeout;

    var loadingStart = function() {
      loadingTimeout = setTimeout(function() {
        document.getElementById("loading").classList.add("loading");
      }, 300)
    }

    var loadingStop = function() {
      document.getElementById("loading").classList.remove("loading");
      clearTimeout(loadingTimeout)
    }

    this.onAdd = function (m) {
      this._map = m;
      var networkMap = m;

      const worker = new Worker('/assets/js/networkControl/networkControlWorker.js');

      worker.addEventListener('message', function(e) {

        if (e.data.name && e.data.name === "networkTree") {
          // console.log(e.data);

          networkMap.getSource("worker").setData(e.data);

          // console.log(e.data)

          loadingStop();

        }
      }, false);

      worker.postMessage(linearNetwork)

      networkMap.addSource("worker", {
        type: "geojson",
        data: blankGeoJSON
      });

      networkMap.addLayer({
        id: "workerHalo",
        type: "line",
        source: "worker",
        paint: {
          "line-color": "yellow",
          "line-width": 8,
          "line-opacity": 0.6
        }
      });

       networkMap.addLayer({
        id: "worker",
        type: "line",
        source: "worker",
        paint: {
          "line-color": "Yellow",
          "line-width": 4,
          "line-opacity": 1
        }
      });

      networkMap.on('click', function (e) {
        this.getSource("worker").setData(blankGeoJSON);
        // console.log(networkMap.queryRenderedFeatures(e.point))
      });

      function networkControlClickHandler(e) {

        networkMap.moveLayer("workerHalo")
        networkMap.moveLayer("worker")

        var features = networkMap.queryRenderedFeatures(e.point, {layers: originLayers});

        if (features && features.length > 0) {
          if (!features[0].properties[idField]) {
            console.error("error, no field", idField, "in the source features");
            return
          }

          loadingStart();


          console.log("searching for matching point in originLayers")

          var point = originPoints.features.filter(f => {
            return f.properties[idField] === features[0].properties[idField]
          })
          if (point.length < 1) {
            loadingStop();
            return
          }
          // console.log(point)
          point[0].name = networkTraceDirection;
          worker.postMessage(point[0])

          return

        }
      }

      this._btn = document.createElement('button');
      this._btn.type = 'button';
      this._btn['aria-label'] = 'Location Control';
      this._btn.title = "Trace Network";
      this._btn.id = "networkControlBtn";
      this._btn.style.lineHeight = "0px"
      this._btn.innerHTML = "<img src='/assets/symbols/vector-polyline.svg' with='80%' height='80%'>";
      this._btn.onclick = function () {
        if (opts.debug && opts.debug === true) {
          console.warn('debugging is on')
        }

        networkMap.getSource("worker").setData(blankGeoJSON);

        var btn = this;

        networkTraceDirection = "upstream";

        console.log(networkTraceDirection)

        if (this.classList.contains("downstream")) {
          this.classList.remove("downstream");
          this.style.backgroundColor = "white";
          this.children[0].src = "/assets/symbols/vector-polyline.svg";
          networkMap.off('click', networkControlClickHandler)
          return
        }

        if (this.classList.contains("upstream")) {
          this.classList.remove("upstream");
          this.classList.add("downstream");
          networkTraceDirection = "downstream";
          btn.children[0].src = "/assets/js/networkControl/trending_down-24px.svg";
          networkMap.on('click', networkControlClickHandler)
        }

        if (!this.classList.contains("upstream") && !this.classList.contains("downstream")) {
          this.classList.add("upstream");
          this.style.backgroundColor = "skyblue";
          this.children[0].src = "/assets/js/networkControl/trending_up-24px.svg";
          networkMap.on('click', networkControlClickHandler)
        }

      };
      this._container = document.createElement('div');
      this._container.id = "networkControl";
      this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
      this._container.appendChild(this._btn);
      return this._container;
    }
    this.onRemove = function () {
      this._container.parentNode.removeChild(this._container);
      this._map = undefined;
      networkMap = undefined;
    };
  }
}

export {
  networkControl
}
