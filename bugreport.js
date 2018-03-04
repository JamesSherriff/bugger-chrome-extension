// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// This extension loads the saved background color for the current tab if one
// exists. The user can select a new background color from the dropdown for the
// current page, and it will be saved as part of the extension's isolated
// storage. The chrome.storage API is used for this purpose. This is different
// from the window.localStorage API, which is synchronous and stores data bound
// to a document's origin. Also, using chrome.storage.sync instead of
// chrome.storage.local allows the extension data to be synced across multiple
// user devices.

function getCurrentTabUrl(callback) {
  // Query filter to be passed to chrome.tabs.query - see
  // https://developer.chrome.com/extensions/tabs#method-query
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, (tabs) => {
    // chrome.tabs.query invokes the callback with a list of tabs that match the
    // query. When the popup is opened, there is certainly a window and at least
    // one tab, so we can safely assume that |tabs| is a non-empty array.
    // A window can only have one active tab at a time, so the array consists of
    // exactly one tab.
    var tab = tabs[0];

    // A tab is a plain object that provides information about the tab.
    // See https://developer.chrome.com/extensions/tabs#type-Tab
    var url = tab.url;

    // tab.url is only available if the "activeTab" permission is declared.
    // If you want to see the URL of other tabs (e.g. after removing active:true
    // from |queryInfo|), then the "tabs" permission is required to see their
    // "url" properties.
    console.assert(typeof url == 'string', 'tab.url should be a string');

    callback(url);
  });

  // Most methods of the Chrome extension APIs are asynchronous. This means that
  // you CANNOT do something like this:
  //
  // var url;
  // chrome.tabs.query(queryInfo, (tabs) => {
  //   url = tabs[0].url;
  // });
  // alert(url); // Shows "undefined", because chrome.tabs.query is async.
}

function configExists(callback) {
  chrome.storage.sync.get("bugger", function(storedConfigValue) {
    if (storedConfigValue["bugger"]["host"] != null && storedConfigValue["bugger"]["host"] != "" && storedConfigValue["bugger"]["key"] != null && storedConfigValue["bugger"]["key"] != "") {
      // SEND REQUEST TO SERVER AND VERIFY KEYS
      callback(true);
    }
    else {
      callback(false);
    }
  });
}

function getConfig(callback) {
  chrome.storage.sync.get("bugger", function(storedConfigValue) {
    callback(storedConfigValue["bugger"]);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  configExists(function(exists) {
    if(exists) {
      // TAKE SCREENSHOT AND SEND ETC ETC....
      chrome.tabs.captureVisibleTab(function(screenshotUrl) {
        document.getElementById("photo").setAttribute("src", screenshotUrl);
        document.getElementById("submit").addEventListener("click", function() {
          $('.loader').show();
          $('#content').css('filter', 'blur(4px)');
          $('#content').css('filter', 'url("blur.svg#gaussian_blur");');
          $('#content').css('-webkit-filter', 'blur(4px)');
          $('submit').disable;
          getConfig(function(config) {
            var description = document.getElementById("description").value;
            var key = config["key"];
            var host = config["host"];
            getCurrentTabUrl(function(currentUrl) {
              var url = currentUrl;
              var browser_version = /Chrome\/([0-9.]+)/.exec(navigator.userAgent)[1];
              var dppx = window.devicePixelRatio || (window.matchMedia && window.matchMedia("(min-resolution: 2dppx), (-webkit-min-device-pixel-ratio: 1.5),(-moz-min-device-pixel-ratio: 1.5),(min-device-pixel-ratio: 1.5)").matches? 2 : 1) || 1;
              var width = screen.width * dppx;
              var height = screen.height * dppx;
              $.ajax({method: "POST", url: host, data: {"key": key, "description": description, "screenshotBase64": screenshotUrl, "currentURL": url, "browserVersion": "Chrome - " + browser_version, "browserLanguage": window.navigator.language, "deviceResolution": width + " x " + height, "browserResolution": screen.width + ' x ' + screen.height}}).done(function(data)
              {
                if(data["status"] == "success")
                {
                  $('body').html("<h1>Bug report sent.</h1>");
                }
                else if(data["status"] == "error")
                {
                  $('body').html("<h1>Error - " + data["message"] + "</h1>");
                }
              });
            });
          });
        })
      });
    }
    else {
      window.location.href="noconfig.html";
    }
  });
});
