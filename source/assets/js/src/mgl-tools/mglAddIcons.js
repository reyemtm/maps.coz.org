function mglAddIcons(map, icons, callback) {
  let total = icons.length;
  icons.forEach(icon => {
    map.loadImage(icon.url, function(error, image) {
      if (error) console.log(error);
      map.addImage(icon.name, image);
      total = total - 1;
      if (!total) {
          console.log("icon loading complete!")
          callback()
        }
      }
    )
  })
}

export {
  mglAddIcons
}