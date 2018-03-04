function setConfig(callback) {
  var config = {};
  config["host"] = document.getElementById("host").value;
  config["key"] = document.getElementById("key").value;
  chrome.storage.sync.set({"bugger": config});
  callback();
}

function getConfig(callback) {
  chrome.storage.sync.get("bugger", function(storedConfigValue) {
    callback(storedConfigValue["bugger"]);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  getConfig(function(config) {
    document.getElementById("host").value = config["host"]
    document.getElementById("key").value = config["key"]
  }); 
  document.getElementById("submit").addEventListener("click",function() {
    setConfig(function() {
      window.location.href="configset.html";
    });
  });
});
