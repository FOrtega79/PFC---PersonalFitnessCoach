/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-afac4cd2'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "d9a0e75fbbaff528864dba7686db1ff2"
  }, {
    "url": "pwa-512x512.png",
    "revision": "9bc060870d34ad49db94e56a9595acb6"
  }, {
    "url": "pwa-192x192.png",
    "revision": "7c52e1c875117f703abffbd731ae952c"
  }, {
    "url": "index.html",
    "revision": "ead30b3c85dbd91c7f155080f70e5093"
  }, {
    "url": "icon.svg",
    "revision": "d39f92c1ff3bc86c63633c77e46bb414"
  }, {
    "url": "favicon.ico",
    "revision": "17e5fd61da8a4e4b0146761190d70483"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "010d981ef1b09aab0ee72f1556b22676"
  }, {
    "url": "assets/index-D9-Xcn1F.js",
    "revision": null
  }, {
    "url": "assets/index-D1Oiz65e.css",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "010d981ef1b09aab0ee72f1556b22676"
  }, {
    "url": "favicon.ico",
    "revision": "17e5fd61da8a4e4b0146761190d70483"
  }, {
    "url": "icon.svg",
    "revision": "d39f92c1ff3bc86c63633c77e46bb414"
  }, {
    "url": "pwa-192x192.png",
    "revision": "7c52e1c875117f703abffbd731ae952c"
  }, {
    "url": "pwa-512x512.png",
    "revision": "9bc060870d34ad49db94e56a9595acb6"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "d9a0e75fbbaff528864dba7686db1ff2"
  }, {
    "url": "manifest.webmanifest",
    "revision": "9d8adb47d4138ac7c74a2cf7e498d171"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
