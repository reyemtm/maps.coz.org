// import Fuse from 'fuse.js'

//FUZZY IS FASTER THAN FUSE
var fuzzy = require("fuzzy");

import {
  getJSON
} from './coz-helpers.js'

var geocoderData,
  geocoderDataList;

// var fuse = new Fuse([])

getJSON('https://311.coz.org/api/v1/feature-server/collections/public.eng_coz_geocoder_mview/items.json', function (data) {
  geocoderData = data;
  geocoderDataList = [];
  geocoderData.features.forEach(function (f) {
    if (f.properties.t && f.properties.a) {
      geocoderDataList.push(f.properties.t)
      if ((f.properties.a).toLowerCase() === "city hall") {
        geocoderDataList.push("")
      }else{
        geocoderDataList.push(f.properties.a)
      }
    }
  });
  // fuse.setCollection(geocoderDataList)
})

function createFeature(feature) {
  var p = feature.properties;
  var lng = feature.geometry.coordinates[0], lat = feature.geometry.coordinates[1];

  return {
    center: [lng, lat],
    geometry: {
      type: "Point",
      coordinates: [lng, lat]
    },
    text: "text" + p.a,
    title: "title" + p.a,
    place_name: p.t + ", " + p.a,
    place_type: ['address'],
    properties: {},
    type: 'Feature'
  };
}

function localGeocoder(query) {
  // // match anything which looks like a parcel number or address
  // var match = query.match('([0-9][0-9]([0-9]|(-))).*$');

  // if (!match) {
  //   return null;
  // }

  var geocodes = [];
  var ids = [];
  
  var results = fuzzy.filter(query, geocoderDataList);

  // console.log(test)

  // var results = fuse.search(query)

  // console.log(results)

  if (results) {
    var matches = results.map(function (el) {
      return el.string;
    });
    // var matches = results.map(function (el) {
    //   return el.item;
    // });
    var sliced = matches.slice(0, 10)

    for (var s in sliced) {
      geocoderData.features.forEach(function (f,i) {
        if (ids.indexOf(i) < 0) {
          if (f.properties.t === sliced[s] || f.properties.a === sliced[s]) {
            ids.push(i)
            geocodes.push(createFeature(f))
          }
        }
      })
    }
  }

  return geocodes;
}

export {
  localGeocoder
}