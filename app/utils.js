
// STRING
function replaceAll(find, replace, str) {
    return str.replace(new RegExp(find, 'g'), replace);
  }
  
  // TIME
  var globalStartTime = 0.0;
  
  
  function resetTimer() {
      globalStartTime = Date.now();
  }
  
  function timerValue() {
      return (Date.now() - globalStartTime) / 1000.0;
  }
  
  
  // MATH
  function degToRad (angle) {
      return Math.PI * angle / 180;
  }
  
  function clamp (min, max, value) {
      if (value < min)
          return min;
      if (value > max)
          return max;
      return value;
  }
  
  // ERROR HANDLE
  function handleInitError(str) {
      throw new Error(str);
  }
  
  // TEXTURES
  function handleLoadedTexture(texture, textureCanvas, gl) {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureCanvas); 
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.bindTexture(gl.TEXTURE_2D, null);
  }
  
  function createTexture(gl, size) {
      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size.offsetWidth, size.offsetHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      return texture;
  }
  
  // Context menu helpers
  var globalSelectedIndex = -1;
  
  function menuSetCallback(name) {
      globalSelectedIndex = name;
  }
  
  function initializeContextMenuOn(elementsPrefix, menuId, menuSetCallback) {
      var mozilla = document.getElementById && !document.all
      var ie = document.all
      var contextisvisible=0
      var elements=$("[id^='" + elementsPrefix + "']")
  
      function iebody() {
          return (document.compatMode && document.compatMode!="BackCompat")? document.documentElement : document.body
      }
  
      function displaymenu(index){
          return function (e) {
              var el = document.getElementById(menuId)
              contextisvisible = 1
              if (mozilla) {
                  el.style.left = pageXOffset + e.clientX + "px"
                  el.style.top = pageYOffset + e.clientY + "px"
                  el.style.visibility = "visible"
                  e.preventDefault()
                  menuSetCallback(elementsPrefix + index, index)
                  return false
              }
              else if (ie) {
                  el.style.left = iebody().scrollLeft + event.clientX
                  el.style.top = iebody().scrollTop + event.clientY
                  el.style.visibility = "visible"
                  menuSetCallback(elementsPrefix + index, index)
                  return false
              }};
      }
  
      function hidemenu(index) {
          return function(index) {
              if (typeof el!="undefined" && contextisvisible){
                  el.style.visibility="hidden"
                  contextisvisible=0
              }};
      }
  
      if (mozilla) {
          for (var i=0; i< elements.length; i++)
              elements[i].addEventListener("contextmenu", displaymenu(i), true)
          document.addEventListener("click", hidemenu(i), true)
      }
      else if (ie){
          for (var i=0; i< elements.length; i++)
              elements[i].attachEvent("oncontextmenu", displaymenu(i))
          document.attachEvent("onclick", hidemenu(i))
      }
  }
  
  function getURLParameter(sParam) {
      var sPageURL = window.location.search.substring(1);
      var sURLVariables = sPageURL.split('&');
      for (var i = 0; i < sURLVariables.length; i++) {
          var sParameterName = sURLVariables[i].split('=');
          if (sParameterName[0] == sParam) 
              return sParameterName[1];
      }
  }