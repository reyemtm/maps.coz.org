/**
 * Generate a random string of the given length
 * @param {integer} n Number of character
 * @return {string} random string
 */
var randomString = function(n) {
    var result = "";
    if (!n) n = 5;
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < n; i++)
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    return result;
};
/**
 * Generate a random hsla color string, with fixed saturation and lightness
 * @param {number} opacity opacity from 0 to 1
 * @param {number} random value from 0 to 1
 * @param {number} saturation from 0 to 100
 * @param {number} lightness from 0 to 100
 */
var randomHsl = function(opacity, random, saturation, lightness) {
    if (!opacity) opacity = 1;
    if (!saturation) saturation = 100;
    if (!lightness) lightness = 50;
    if (!random) random = Math.random();
    res = "hsla(" + (random * 360) +
        ", " + saturation + "% " +
        ", " + lightness + "% " +
        ", " + opacity + ")";
    return res;
};

/**
 * Remove multiple layers by prefix
 * @param {object} map Map object
 * @param {string} prefix Prefix to search for in layers, if something found, remove it
 * @return {array} List of removed layer 
 */
var removeLayersByPrefix = function(map, prefix) {
    var result = [];

    if (map) {
        // no method to get all layers ?
        var layers = map.style._layers;
        for (var l in layers) {
            if (l.indexOf(prefix) > -1) {
                map.removeLayer(l);
                result.push(l);
            }
        }
    }

    return result;
};

/**
 * Create and manage multiple progression bar
 * @param {boolean} enable Enable the screen 
 * @param {string} id Identifier of the given item
 * @param {number} percent Progress bar percentage
 * @param {string} text Optional text
 */
var progressScreen = function(enable, id, percent, text ) {

    console.log(percent)

    lScreen = document.getElementsByClassName("loading-screen")[0];

    if (!enable) {
        if (lScreen) lScreen.remove();
        return;
    }

    if (!id || !percent || !text) return;

    if (!lScreen && enable) {
        lBody = document.getElementsByTagName("body")[0];
        lScreen = document.createElement("div");
        lScreen.className = "loading-screen";
        lScreenContainer = document.createElement("div");
        lScreenContainer.className = "loading-container";
        lScreen.appendChild(lScreenContainer);
        lBody.appendChild(lScreen);
    }

    lItem = document.getElementById(id);

    if (!lItem) {
        lItem = document.createElement("div");
        lItem.className = "loading-item";
        lItem.setAttribute("id", id);
        pBarIn = document.createElement("div");
        pBarIn.className = "loading-bar-in";
        pBarOut = document.createElement("div");
        pBarOut.className = "loading-bar-out";
        pBarTxt = document.createElement("div");
        pBarTxt.className = "loading-bar-txt";
        pBarOut.appendChild(pBarIn);
        lItem.appendChild(pBarTxt);
        lItem.appendChild(pBarOut);
        lScreenContainer.appendChild(lItem);
    } else {
        pBarIn = lItem.getElementsByClassName("loading-bar-in")[0];
        pBarTxt = lItem.getElementsByClassName("loading-bar-txt")[0];
    }

    if (percent >= 100) {
        lItem = document.getElementById(id);
        if (lItem) lItem.remove();
    } else {
        pBarIn.style.width = percent + "%";
        pBarTxt.innerHTML = text;
    }

    lItems = lScreenContainer.getElementsByClassName("loading-item");

    if (lItems.length === 0) progressScreen(false);

};



// geojson type to mapbox gl type
var typeSwitcher = {
    "Point": "circle",
    "MultiPoint": "line",
    "LineString": "line",
    "MultiLineString": "line",
    "Polygon": "fill",
    "MultiPolygon": "fill",
    "GeometryCollection": "fill"
};