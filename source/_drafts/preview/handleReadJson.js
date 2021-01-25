// Importation of helpers
importScripts(
    "./geojsonhint.js",
    "./turf_bbox.js",
    "./helpers.js"
    );

// Inital message
postMessage({
  progress: 0,
  message: "start"
});


// handle message send from the main thread
onmessage = function(e) {
  try {

    /**
     * Initialisation : set local helper and variables
     */

    // init variables
    var errorMsg = "";
    var warningMsg = "";
    var dat = e.data;
    var gJson = dat.json;
    var fileName = dat.fileName;

    // set basic timing function
    timerVal = 0;

    // start timer
    var timerStart = function() {
      timerVal = new Date();
    };

    // give intermediate time, reset timer
    var timerLap = function() {
      var lap = new Date() - timerVal;
      timerStart();
      return lap;
    };

    // printable version of timerLaè
    var timerLapString = function() {
      return " " + timerLap() + " ms ";
    };

    // start timer
    timerStart();

    /**
     * validation : geojson validation with geojsonhint
     */

    // Validation. Is that a valid geojson ?
    var messages = geojsonhint.hint(gJson);
    // extract errors
    var errors = messages.filter(function(x){
      return x.level == "error";
    });
    // extract message
    var warnings = messages.filter(function(x){
      return x.level == "message";
    });

    // set a message with summary
    var logMessage = " geojson validation " +
      " n errors = " + errors.length +
      " n warnings = " + warnings.length + " done in" +
      timerLapString();

    console.log(fileName + ":" + logMessage);

    // send message
    postMessage({
      progress: 60,
      message: logMessage
    });

    // validation : warnings
    if (warnings.length > 0) {
      warningMsg = warnings.length + " warning message(s) found. Check the console for more info";
      postMessage({
        progress: 75,
        msssage: warningMsg
      });
      warnings.forEach(function(x) {
        console.log({file:fileName,warnings:x});
      });
    }
    // varlidation: errors
    if (errors.length > 0) {
      errorMsg = errors.length + " errors found. check the console for more info";
      postMessage({
        progress: 100,
        msssage: errorMsg,
        errorMessage: errorMsg
      });

      errors.forEach(function(x) {
        console.log({file:fileName,errors:x});
      });

      return;
    }


    /**
     * Get extent : get extent using a Turf bbox
     */

    var extent = turf.bbox(gJson);

    // Quick extent validation 
    if (
        extent[0] > 180 || extent[0] < -180 ||
        extent[1] > 89 || extent[1] < -89 ||
        extent[2] > 180 || extent[2] < -180 ||
        extent[3] > 89 || extent[3] < -89
       ) {
      errorMsg = fileName + " : extent seems to be out of range: " + extent;

      postMessage({
        progress: 100,
        msssage: errorMsg,
        errorMessage: errorMsg
      });

      console.log({
        "errors": errorMsg
      });
      return;
    }

    postMessage({
      progress: 80,
      message: " extent found in " + timerLapString()
    });


    /**
     * Avoid multi type : we don't handle them for now
     */

    var geomType = [];
    if( gJson.features ){
      // array of types in data
      geomTypes  = gJson.features
        .map(function(x){
          return typeSwitcher[x.geometry.type];
        })
      .filter(function(v,i,s){
        return s.indexOf(v) === i;
      });
    }else{
      geomTypes = [typeSwitcher[gJson.geometry.type]];
    }


    postMessage({
      progress: 90,
      message: " geom types =" + geomTypes + " found in " + timerLapString()
    });

    // if more than one type, return an error
    if ( geomTypes.length>1) {
      var msg = "Multi geometry not yet implemented";

      postMessage({
        progress: 100,
        msssage: msg,
        errorMessage: fileName + ": " + msg
      });

      console.log({
        "errors": fileName + ": " + msg + ".(" + geomTypes + ")"
      });
      return;
    }


    /**
     * Set default for a new layer
     */

    // Set random id for source and layer
    var id = "mgl_drop_" + randomString(5) + "_" + fileName ;
    // Set random color
    var ran = Math.random();
    var colA = randomHsl(0.1, ran);
    var colB = randomHsl(0.5, ran);

    // Set default type from geojson type
    var typ = geomTypes[0];

    // Set up default style
    var dummyStyle = {
      "circle": {
        "id": id,
        "source": id,
        "type": typ,
        "paint": {
          "circle-color": colA
        }
      },
      "fill": {
        "id": id,
        "source": id,
        "type": typ,
        "paint": {
          "fill-color": colA,
          "fill-outline-color": colB
        }
      },
      "line": {
        "id": id,
        "source": id,
        "type": typ,
        "paint": {
          "line-color": colA,
          "line-width": 10
        }
      }
    };


    postMessage({
      progress: 99,
      message: "Add layer",
      id: id,
      extent: extent,
      layer: dummyStyle[typ]
    });
  }

  catch(err) {
    console.log(err);
    postMessage({
      progress: 100,
      errorMessage : "An error occured, yey ! Quick, check the console !"
    });
  }
};
