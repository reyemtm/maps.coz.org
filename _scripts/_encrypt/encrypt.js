/** Script to encrypt files using a simple batch file and staticrypt on windows
 *  
 * @param {file} - name and relative location of batch file, a separate .bat file for each file you want to encrypt 
 * @param {example} -  
 * staticrypt public/internal/impervious-viewer/index.html -t "Pre-Release COZ Map" -i "This application is still in development. Please visit <a href='https://www.coz.org/maps'>www.coz.org/maps</a> for the latest public maps. If you need access to this page please contact the City of Zanesville's Engineering Division at 740-617-4910." -e -o "./public/internal/impervious-viewer/index.html" -f "encrypt_template.html" password
  */

function runEncrypt(file) {
  var cmd = require('child_process')

  console.log('encrypting...')
  cmd.exec('cmd /c ' + file, function() {

  })
}

// runEncrypt('C:/Master_GIS/GIS_Applications/production/MapPortal/_encrypt/encryptwifi.bat');

runEncrypt('C:/Master_GIS/GIS_Applications/production/MapPortal/_encrypt/stormwater.bat')