var Center = require("@turf/center").default

/**
 * Create a story map using a GeoJSON in Mapbox GL JS
 * 
 * @param {object} map mapbox map object
 * @param {json} geojson GeoJSON with TITLE and INFO fields
 * @param {element} storyId id of element where to create the story
 */

function createStory(map, geojson, storyId) {

  /**
   * main function
   */
  var projectListNew = [];
  geojson.features.map(function(feature) {
    var center = Center(feature);
    var p = feature.properties;
    var info = (p.INFO != null) ? p.INFO : "";
    projectListNew.push({
      title: p.TITLE,
      body: info,
      center: center.geometry.coordinates,
      bearing: (p.bearing != null) ? p.bearing : 0,
      pitch: (p.pitch != null) ? p.pitch : 0,
      zoom: (p.zoom != null) ? p.zoom : 16,
      speed: 0.8
    });
  });

  console.log(projectListNew)
  for (var i = 0; i < projectListNew.length; i++) {
    var next = i + 1;
    var prev = i - 1;
    if (i === (projectListNew.length -1)) {
      var next = 0;
    }
    if (i === 0) {
      var prev = projectListNew.length - 1;
    }
    createProjectList(storyId, projectListNew[i], i, next, prev);
    
    var projects = document.getElementById(storyId);

    var firstProject = projects.children[0];
    firstProject.classList.add('active')
    projects.setAttribute('style','height:' + (firstProject.clientHeight) + "px");

    projects.onscroll = function () {
      for (var i = 0; i < projectListNew.length; i++) {
        var projectName = "project" + i;
        if (isElementOnScreen(projectName)) {
          setActiveChapter(projectName, i);
          break;
        }
      }
    };
  }

  /*
  helper functions
  */

  function createProjectList(div, p, id, next, prev) {
    var project = document.createElement('section');
    project.id = "project" + id;
    project.classList.add("project");
    var title = document.createElement('h3');
    title.textContent = p.title;
    title.classList.add('story-title');
    var body = document.createElement('div');
    body.classList.add('story-body');
    body.innerHTML = p.body;
    var nextlink = document.createElement('a');
    nextlink.href="#project" + next;
    nextlink.textContent = ">";
    nextlink.classList.add("btn");
    nextlink.classList.add("btn-secondary");
    nextlink.setAttribute("data-scroll", "");

    if (prev != null) {
      nextlink.style.float = "right";
      var prevlink = document.createElement('a');
      prevlink.classList.add("btn");
      prevlink.classList.add("btn-secondary");
      prevlink.setAttribute("data-scroll", "");
      prevlink.href="#project" + prev;
      prevlink.textContent = "<";
    }

    project.appendChild(title);
    project.appendChild(body);
    if (prev != null) {
      project.appendChild(prevlink);
    }
    project.appendChild(nextlink);
    var div = document.getElementById(div);
    div.appendChild(project)
  }

  function setActiveChapter(projectName, number) {
    if (projectName === activeprojectName) return;
    var f = document.getElementById(storyId);
    var p = document.getElementById(projectName);
    f.setAttribute('style','height:' + (p.clientHeight - 10) + "px");
    map.flyTo(projectListNew[number]);
    document.getElementById(projectName).setAttribute('class', 'active');
    document.getElementById(activeprojectName).setAttribute('class', '');

    activeprojectName = projectName;
  }

  function isElementOnScreen(id) {
    var element = document.getElementById(id);
    var bounds = element.getBoundingClientRect();
    return bounds.top < window.innerHeight && bounds.bottom > 20;
  }
}

export {
  createStory
}