crowdext.onFirefoxLoad = function(event) {
  document.getElementById("contentAreaContextMenu")
          .addEventListener("popupshowing", function (e){ crowdext.showFirefoxContextMenu(e); }, false);
};

crowdext.showFirefoxContextMenu = function(event) {
  // show or hide the menuitem based on what the context menu is on
  document.getElementById("context-crowdext").hidden = gContextMenu.onImage;
};

window.addEventListener("load", crowdext.onFirefoxLoad, false);
