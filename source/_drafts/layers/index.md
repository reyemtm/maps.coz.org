---
title: Available Map Layers
css: >-
  h3,h4,h5 {
    margin-top: 0rem;
    margin-bottom: 0;
  }
  .card-body {
    display: block;
  }
  .card:hover {
    background-color: transparent;
    box-shadow: none;
  }
permalink: /layers/
---
## City of Zanesville Mapbox Layer Styles

This page displays all of the map layers currently available and the data associated with them.

<script>

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
        // errorHandler && errorHandler(status);
      }
    };
    xhr.send();
  }

  var layers = document.querySelector(".container");

  getJSON('/map-layers-config.json', function(json) {
    var div = document.createElement('div');
    div.classList.add('columns');
    div.classList.add('is-horizontal-align');
    json.map(function(layer) {
      let card = document.createElement('div');
      let body = document.createElement('div');
      card.classList.add('card');
      body.classList.add('card-body');
      var length = (!layer.layerGroup) ? 0 : layer.layerGroup.length;
      body.innerHTML += '<h4>' + layer.name + '</h4>' +
      'Layer ID: ' + layer.id + '</br>' +
      'Directory: ' + layer.directory + '<br>';
      if (length > 0) {
        body.innerHTML += "Layer Group";
         var g = layer.layerGroup;
        for (l in g) {
          body.innerHTML += '<li>' + g[l].name + ' (ID: ' + g[l].id + ')</li>'
        }      }
      card.appendChild(body);
      div.appendChild(card);
    });
    layers.appendChild(div)
  });

</script>