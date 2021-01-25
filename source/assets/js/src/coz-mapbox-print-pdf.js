var cozMapboxPrint = require('../../../../mapbox-print-pdf');

/* to do
 - bake all ids into the function or as variables
 - deleted logo due to new logo wont really work with printing
*/

mapboxgl.accessToken = 'pk.eyJ1IjoiZGVtb2FjY291bnQxMiIsImEiOiJjamUzZTQwMTIyNmQyMzRvNm53NDJ4emdmIn0.4MH5FDzsJT37L2GFZxUIjw';

function savePDF(pdf) {
  var title = document.getElementById("export-title").value;
  var filename = "";
  if (!title) {
    filename = "coz_web_export_map.pdf"
  }else{
    filename = title.replace(/\s/g, "_") + ".pdf";
  }
  pdf.save(filename);
}

function showProgress() {
  var exportLoader = document.getElementById('export-loader');
  exportLoader.classList.add("loading");
}

function hideProgress() {
  if (document.querySelector("#cozPrintArea")) document.querySelector("#cozPrintArea").remove()
  var exportLoader = document.getElementById('export-loader');
  exportLoader.classList.remove("loading");
  window.location.hash = "close";
}

function printMap(m, opts) {
  showProgress();

  if (!opts) {
    var opts = {
      defaultTitle: "Web Map Export",
      info: "&nbsp;"
    }
  }else{
    var opts = opts;
  }

    opts.format = document.getElementById('map-print--modal-format').value;

    var mapAttribution = document.getElementsByClassName('mapboxgl-ctrl-attrib');
    var attribBase = mapAttribution[0].innerText;
    var attrib = attribBase.slice(0,-17);
    var a = (mapAttribution.length > 0) ? attrib : "Map &copy; 2019 City of Zanesville | &copy; Mapbox &copy; OpenStreetMap";

    var currentScale = document.getElementById('map-print--modal-scale');
    var scale = (currentScale.value != 1) ? "<em style='font-size:0.7rem;color:gray;'>&nbsp;|&nbsp; 1in ~ " + currentScale.value + "ft</em>" : "&nbsp;";
    
    var t = (!opts.defaultTitle || opts.defaultTitle === "") ? "Map Title: ___________" : opts.defaultTitle;
    var n = (!opts.info || opts.info === "") ? "" : opts.info;
    var newTitle = document.getElementById("export-title");
    var newTitleValue = newTitle.value;
    if (newTitleValue != "") {
      t = newTitleValue
    }
 
    var legendItems = document.querySelectorAll(".mgl-layerControlLegend");
    var legend = '';
    if (legendItems.length > 0) {
      for (var i=0; i < legendItems.length; i++) {
        if (legendItems[i].parentElement.style.display != "none" && legendItems[i].parentElement.children[0].checked) {
          // console.log(legendItems[i])
          legend += legendItems[i].innerHTML + "<br><br>"
        }
      }
    }

    var legendHtml = '<div style="font-size:0.8rem;"><strong>Map Legend</strong><br><br>' + legend + '</div>'

    var printed = new Date().toLocaleDateString();

    var footer = '<div style="font-family:inherit;margin-left:10px;"> \
    <em style="font-size:0.6rem;color:gray;letter-spacing:0.5px;padding-top:2px;">' + a + '&nbsp;|&nbsp;Printed on&nbsp;' + printed + '&nbsp;' + scale + '</em><br> \
    <div style="float:left;padding-left:0;margin-top:10px;padding-right:20px;border-right:solid 2px #333;text-align:center;"> \
      <div style="font-size:x-large;font-weight:bold;">City of Zanesville</div> \
      <div style="font-weight:500;"> \
        Department of Public Service<br> Division of Engineering \
      </div> \
    </div> \
    <div style="float:left;padding-left:20px;padding-top:10px;"> \
      <div>' + t + '</div> \
      <div>' + n + '</div> \
    </div> \
    <div style="float:right;width:300px;height:100px;overflow:hidden;font-size:0.7rem;padding-top:5px;margin-right:10px;letter-spacing:1.2px;text-align:justify;"> \
      <em> \
        <span style="font-weight:bold;">Map Disclaimer</span> \
            <br>City of Zanesville does not guarantee the accuracy of this data. This map is subject to all terms and conditions of the disclaimer posted at www.coz.org/map-disclaimer.</em> \
    </div>';
    
    var addLegend = document.getElementById("map-print--modal-legend");

    var scaleControlWidths = {
      "letter": 12.5,
      "tabloid": 8
    }

    var buildPDF = cozMapboxPrint.build();
    
    buildPDF.format(opts.format)
    .landscape(true);
    if (addLegend.checked) {
      buildPDF.header({
        html: legendHtml,
        width: {
          value: 100,
          unit: "pixels"
        },
        baseline: {
          format: opts.format,
          orientation: "l"
        }
      })
    }
    buildPDF.footer({
      html: footer,
      baseline: {
        format: opts.format,
        orientation: "l"
      }
    })
    buildPDF.scale({
      maxWidthPercent: scaleControlWidths[opts.format],
      unit: "imperial"
    })
    .margins(0.25, "in")
    .print(m, mapboxgl)
    .then(savePDF)
    .then(hideProgress);
}

function cozMapboxPrintSetup(map, options) {

  var cozMapboxPrintSetupMap = map;

  if (!options) {
    options = {
      defaultTitle: "COZ Web Map Export",
      info: "&nbsp;"
    }
  }

  var exportMap = document.getElementById("export-map");
  exportMap.onclick = function() {
    printMap(map, options)
  }

  var printForm = document.getElementById("print-form");
  printForm.addEventListener("submit", function(e) {
    e.preventDefault();
    exportMap.click()
  })

  var printPreviewLoader = document.getElementById('print-preview-button');

    printPreviewLoader.onclick = function() {
    console.log('print preview initiated');
    console.log(window.screen.width / window.screen.height);

    window.location.hash = "modal-print";
    var exportTitle = document.getElementById('export-title');
    exportTitle.value = options.defaultTitle;

    var exportLoader = document.getElementById('export-loader');

    function showPreview() {
      exportLoader.classList.add("loading");

      setTimeout(function() {
        if (!document.querySelector("#cozPrintArea")) {
          var printArea = document.createElement("div");
          printArea.id = "cozPrintArea";
          printArea.style.outline = "dashed 2px black";
          printArea.style.width = (document.getElementById("map-print--modal-format").value === "letter") ? "1010px" : "1600px";
          printArea.style.height = (document.getElementById("map-print--modal-format").value === "letter") ? "660px" : "900px";
          printArea.style.margin = "0 auto";
          printArea.style.position = "relative";
          printArea.style.top = "50%";
          printArea.style.transform = "translateY(-50%)";
          printArea.style.pointerEvents = "none";
          cozMapboxPrintSetupMap._container.appendChild(printArea)
        }else{
          printArea = document.querySelector("#cozPrintArea")
        }

        // var printPreview = document.getElementById("map-print-modal--preview");
        // printPreview.style.display = "none";
        // printPreview.style.width = "100%";
        // printPreview.style.height = "300px"
        // printPreview.style.backgroundPosition = "center";
        // printPreview.style.backgroundSize = "cover";
        // printPreview.style.margin = "0 auto";
        // printPreview.style.border = "solid 2px lightgray";
        // printPreview.style.transform = "scale(1)";

        //https://www.pixelto.net/inches-to-px-converter
        // var img = "<img src='" + cozMapboxPrintSetupMap.getCanvas().toDataURL('image/png') + "' style='width:100%;'>";
        // printPreview.style.backgroundImage = "url(" + cozMapboxPrintSetupMap.getCanvas().toDataURL('image/png') + ")"
        exportLoader.classList.remove("loading");
      }, 0);
    }
    
    showPreview()

    /****
     * SCALES TESTED WITH 0.25 IN MARGINS
     * LETTER 1:200 =   16.6 
     * LETTER 1:100 =   17.62
     * LETTER 1:50 =    18.6
     * LETTER 1:20 =    19.95
     * 
     * tabloid 1:200 =  16.65
     * tabloid 1:100 =  17.63
     * tabloid 1:50 =   18.63
     * tabloid 1:20 =   19.93
     */

    var scales = {
      "tabloid": {
        20:19.93,
        50:18.63,
        100:17.63,
        200:16.65
      },
      "letter": {
        20:19.95,
        50:18.6,
        100:17.62,
        200:16.6
      }
    };

    let mapPrintScale = document.getElementById('map-print--modal-scale');
    mapPrintScale.value = 1;

    if(map.getPitch() != 0) {
      mapPrintScale.disabled = true
    }else{
      mapPrintScale.disabled = false
    }

    mapPrintScale.addEventListener('change', function(e) {
      changePrintScale()
    });

    document.getElementById("map-print--modal-format").addEventListener("change", function() {
      changePrintScale()
    })

    function changePrintScale() {
      var currentFormat = document.getElementById('map-print--modal-format').value;
      var mapPrintScaleValue = document.getElementById('map-print--modal-scale').value;

      var printArea = (document.getElementById("cozPrintArea")) ? document.getElementById("cozPrintArea") : null;

      if (printArea) {
        console.log(printArea, currentFormat)
        printArea.style.width = (currentFormat === "letter") ? "1010px" : "1600px";
        printArea.style.height = (currentFormat === "letter") ? "660px" : "900px";
      }

      if (mapPrintScaleValue == 1) {
        return
      }
      map.setZoom(scales[currentFormat][mapPrintScaleValue]);
      showPreview()
    }

  }

  printPreviewLoader.click();

}

export {
  cozMapboxPrintSetup
}