"use strict";

if (global.Turbolinks === undefined) {
  throw "Missing Turbolinks dependency. TurboReact requires Turbolinks be included before it.";
}

var HTMLtoJSX = require("htmltojsx");
var JSXTransformer = require("react-tools");
var React = require("react");

// Disable the Turbolinks page cache to prevent Tlinks from storing versions of
// pages with `react-id` attributes in them. When popping off the history, the
// `react-id` attributes cause React to treat the old page like a pre-rendered
// page and breaks diffing.
global.Turbolinks.pagesCached(0);

var converter = new HTMLtoJSX({createClass: false});
var nextDocument;

var Reactize = {
  version: REACTIZE_VERSION,

  applyDiff: function(replacementElement, targetElement) {
    try {
      var bod = Reactize.reactize(replacementElement);
      React.render(bod, targetElement);
    } catch(e) {
      // If any problem occurs when updating content, send the browser to a full
      // load of what should have been the next page. Reactize should not
      // prevent navigation if there's an exception.
      if (nextDocument !== undefined && nextDocument.URL !== undefined) {
        global.location.href = nextDocument.URL;
      }
    }
  },

  reactize: function(element) {
    var code = JSXTransformer.transform(converter.convert(element.innerHTML));
    return eval(code);
  }
};

global.document.addEventListener("page:before-unload", function(event) {
  // Keep a reference to the next document to be loaded.
  nextDocument = event.target;
});

function applyBodyDiff() {
  Reactize.applyDiff(document.body, document.body);
  global.document.removeEventListener("DOMContentLoaded", applyBodyDiff);
}

global.document.addEventListener("DOMContentLoaded", applyBodyDiff);

// Turbolinks calls `replaceChild` on the document element when an update should
// occur. Monkeypatch the method so Turbolinks can be used without modification.
global.document.documentElement.replaceChild = Reactize.applyDiff;

module.exports = Reactize;
