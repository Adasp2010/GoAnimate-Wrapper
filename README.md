# Hurricane Irma: The Disaster

This is a Unity WebGL build of the game "Hurricane Irma: The Disaster". The game is hosted on Glitch and can be played directly in the browser.

## Project Structure

- `index.html` - The main HTML file that loads and runs the Unity WebGL build.
- `Build/` - Contains the Unity WebGL build files (`.data`, `.wasm`, `.framework.js`, `.loader.js`).
- `TemplateData/` - Contains additional assets like stylesheets and favicon.

## Setup Instructions

### 1. Preparing Unity WebGL Build

Ensure your Unity project is set up to build for WebGL:
1. Open your Unity project.
2. Go to `File > Build Settings`.
3. Select `WebGL` as the target platform.
4. Click `Build` and save the output to a folder (e.g., `WebGLBuild`).

Your build folder should contain the following:
- `Build` folder with `.data`, `.wasm`, `.framework.js`, and `.loader.js` files.
- `TemplateData` folder with `favicon.ico` and `style.css`.

### 2. Uploading to Glitch

1. Go to [Glitch](https://glitch.com/) and create a new project using a simple website template.
2. In the left sidebar, click on the "Assets" tab.
3. Upload all files from your `Build` and `TemplateData` folders.
4. Note the URLs provided by Glitch for each uploaded asset.

### 3. Setting Up `index.html`

Update `index.html` to correctly reference the uploaded assets:

```html
<!DOCTYPE html>
<html lang="en-us">
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <title>Unity WebGL Player | Hurricane Irma: The Disaster</title>
  <link rel="shortcut icon" href="YOUR_GLITCH_ASSET_URL/favicon.ico">
  <link rel="stylesheet" href="YOUR_GLITCH_ASSET_URL/style.css">
</head>
<body>
  <div id="unity-container" class="unity-desktop">
    <canvas id="unity-canvas" width=960 height=600 tabindex="-1"></canvas>
    <div id="unity-loading-bar">
      <div id="unity-logo"></div>
      <div id="unity-progress-bar-empty">
        <div id="unity-progress-bar-full"></div>
      </div>
    </div>
    <div id="unity-warning"> </div>
    <div id="unity-footer">
      <div id="unity-webgl-logo"></div>
      <div id="unity-fullscreen-button"></div>
      <div id="unity-build-title">Hurricane Irma: The Disaster</div>
    </div>
  </div>
  <script>
    var container = document.querySelector("#unity-container");
    var canvas = document.querySelector("#unity-canvas");
    var loadingBar = document.querySelector("#unity-loading-bar");
    var progressBarFull = document.querySelector("#unity-progress-bar-full");
    var fullscreenButton = document.querySelector("#unity-fullscreen-button");
    var warningBanner = document.querySelector("#unity-warning");

    function unityShowBanner(msg, type) {
      function updateBannerVisibility() {
        warningBanner.style.display = warningBanner.children.length ? 'block' : 'none';
      }
      var div = document.createElement('div');
      div.innerHTML = msg;
      warningBanner.appendChild(div);
      if (type == 'error') div.style = 'background: red; padding: 10px;';
      else {
        if (type == 'warning') div.style = 'background: yellow; padding: 10px;';
        setTimeout(function() {
          warningBanner.removeChild(div);
          updateBannerVisibility();
        }, 5000);
      }
      updateBannerVisibility();
    }

    var buildUrl = "YOUR_GLITCH_ASSET_URL";
    var loaderUrl = buildUrl + "/Hurricane irma The Disaster.loader.js";
    var config = {
      dataUrl: buildUrl + "/Hurricane irma The Disaster.data",
      frameworkUrl: buildUrl + "/Hurricane irma The Disaster.framework.js",
      codeUrl: buildUrl + "/Hurricane irma The Disaster.wasm",
      streamingAssetsUrl: "StreamingAssets",
      companyName: "DefaultCompany",
      productName: "Hurricane Irma: The Disaster",
      productVersion: "0.1",
      showBanner: unityShowBanner,
    };

    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      var meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, height=device-height, initial-scale=1.0, user-scalable=no, shrink-to-fit=yes';
      document.getElementsByTagName('head')[0].appendChild(meta);
      container.className = "unity-mobile";
      canvas.className = "unity-mobile";
    } else {
      canvas.style.width = "960px";
      canvas.style.height = "600px";
    }

    loadingBar.style.display = "block";

    var script = document.createElement("script");
    script.src = loaderUrl;
    script.onload = () => {
      createUnityInstance(canvas, config, (progress) => {
        progressBarFull.style.width = 100 * progress + "%";
      }).then((unityInstance) => {
        loadingBar.style.display = "none";
        fullscreenButton.onclick = () => {
          unityInstance.SetFullscreen(1);
        };
      }).catch((message) => {
        alert(message);
      });
    };

    document.body.appendChild(script);
  </script>
</body>
</html>
