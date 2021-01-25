const fs = require("fs");
const express = require("express");
const bodyParser = require('body-parser');
const app = express();
const path = require("path")
const currentLayers = JSON.parse(fs.readFileSync("./source/map-layers-config.json"));

// for parsing application/xwww-
app.use(bodyParser.urlencoded({ extended: true })); 

const schema =   {
    "id": {
      type: "text",
      name: "id",
      readonly: false,
      required: true
    },
    "type": {
      type: "select",
      name: "layer type",
      options: ["line", "circle", "fill", "symbol"],
      readonly: false,
      required: true
    },
    "name": {
      type: "text",
      name: "name",
      readonly: false,
      required: true
    },
    "group": {
      type: "text",
      name: "group",
      readonly: false,
      required: true
    },
    "directory": {
      type:"text",
      name:  "directory",
      readonly: false,
      required: true

    },
    "legend":{
      type: "text",
      name: "legend",
      readonly: false
    },
    "source": {
      type: "text",
      name: "source",
      readonly: false,
      required: true

    },
    "paint": {
      type: "textarea",
      name: "paint",
      readonly: false,
      required: true

    },
    "layout": {
      type: "text",
      name: "visibility",
      readonly: true,
      value: "{'visibility': 'none'}"
    },
    "metadata": {
      type: "text",
      name: "popup",
      readonly: false
    },
    "filter": {
      type: "text",
      name: "filter",
      readonly: false
    },
  }

function layerList (layers) {
  return `
  <ul>
    ${layers.map(l => {
      return `<li onclick="{console.log()}" style="cursor:pointer;">${l.id}</li>`
    }).join('')}
  </ul>
  `
}

function createFormFields(schema, layers) {
  let body = "";
  for (let s in schema) {
    let name = s.replace(/_/g, " ").toUpperCase()
    body += `
    <div class="form-group">
      <label class="form-label" for="${s}">${name}</label>
      ${(!schema[s].options && schema[s].type != "textarea") 
          ?
        `<input class="form-input" id="${s}" type="${schema[s].type}" name="${s}"  value="${(schema[s].value) ? schema[s].value : ''} " ${(!schema[s].readonly) ? '' : 'readonly="true"'} ${(!schema[s].required) ? '' : 'required="true"'}>`
          :
        (!schema[s].options && schema[s].type === "textarea") 
          ?
        `<textarea class="form-input" id="${s}" rows="3" type="${schema[s].type}" name="${s}"  ${(!schema[s].readonly) ? '' : 'readonly="true"'} ${(!schema[s].required) ? '' : 'required="true"'}></textarea>`
          :
        `<select id="${s}" class="form-select" name="${s}" ${(!schema[s].required) ? '' : 'required="true"'}>
          ${schema[s].options.map(o => {
            return `<option>${o}</option>`
          })}
         </select>`
      }
      ${(!schema[s].hint) ? "" : `<p class="form-input-hint">${schema[s].hint}</p>`}
    </div>
    `
  }

  let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Layer Editor</title>
      <link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/milligram/1.4.1/milligram.min.css'/>
      <!--link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/wingcss/1.0.0-beta/wing.min.css'/-->
      <!--link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/skeleton/2.0.4/skeleton.min.css'/-->
      <!--link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/mini.css/3.0.1/mini-dark.min.css'/-->
      <style>
        .container {
          max-width: 150rem;
          overflow: auto;
        }
        .row .column {
          height: 100vh;
          overflow: auto;
        }
      </style>
    </head>
    <body>
    <div class="container">
      <h1>Layer Editor</h1>
      <div class="row">
        <div class="column column-25">
        ${layerList(layers)}
        </div>
        <div class="column column-75">
          <form action="/" method="post" style="padding:0 2rem">
          ${body}
          <button class="button btn" type="Submit">Save</button>
          </form>
        </div>
      </div>  
    </div>
    <script>
    const layers = ${JSON.stringify(layers)}
    </script>
    </body>
    </html>`
  return html
}

const port = 5000

app.get('/', (req, res) => {
  res.send(createFormFields(schema, currentLayers))
})

app.post('/', (req, res) => {
  currentLayers.push(req.body)
  fs.writeFileSync( "./layers.json", JSON.stringify(currentLayers, 0, 2))
  res.send(req.body)
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
