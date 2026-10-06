var $ = function(dom) {
  return document.querySelector(dom);
};

var $ajax = {};
$ajax.BASE_PATH = "/gft-ajax/";
$ajax._load = function(page) {
  var xhr = new XMLHttpRequest();
  xhr.onload = function() {
    if (xhr.status == 200) {
      $("#content").innerHTML = xhr.responseText;

      // script tags don't execute by default we have to do this
      $("#content").querySelectorAll("script").forEach(old => {
        const ns = document.createElement("script");
        ns.textContent = old.textContent;
        old.replaceWith(ns);
      });
    } else {
      $("#content").innerText = xhr.status+" "+xhr.statusText+": " + page;
    }
  };
  xhr.open("GET", $ajax.BASE_PATH + page, true);
  xhr.send();
};


$ajax._onpageload = function() {
  var page = location.hash.substr(1);
  if (!page) page = "home.html";
  $ajax._load(page);
};

// this means on page load this is called, but also when the location.hash changes. meaning <a> links just work. cool!
window.onload = $ajax._onpageload;
window.onhashchange = $ajax._onpageload;
