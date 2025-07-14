/*
 * Copyright (c) 2017-2022 Mozilla Foundation
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

"use strict";

if (globalThis.browser?.runtime?.getURL) {
  // Return the built-in browser object if it already exists.
  // This is the case for Firefox and other browsers that have built-in support
  // for the WebExtension API.
  //
  // NOTE: We are just returning the global `browser` object here, which is the
  //       one that is defined by the browser, and this is the reason why this
  //       is the first thing that this polyfill implementation does.
} else {
  // This is the case for Chrome and other browsers that do not have built-in
  // support for the WebExtension API, and in those cases this polyfill is
  // going to be providing its own implementation of the `browser` object.
  const L10N_BROWSER_LOCALE_KEYS = [
    "fontFamily",
    "fontSize",
    "languageDirection",
  ];
  const L10N_MESSAGES_KEYS = ["name", "description", "placeholders"];
  const APIS_TO_POLYFILL = {
    alarms: {
      clear: { minArgs: 0, maxArgs: 1 },
      clearAll: { minArgs: 0, maxArgs: 0 },
      get: { minArgs: 0, maxArgs: 1 },
      getAll: { minArgs: 0, maxArgs: 0 },
    },
    bookmarks: {
      create: { minArgs: 1, maxArgs: 1 },
      get: { minArgs: 1, maxArgs: 1 },
      getChildren: { minArgs: 1, maxArgs: 1 },
      getRecent: { minArgs: 1, maxArgs: 1 },
      getSubTree: { minArgs: 1, maxArgs: 1 },
      getTree: { minArgs: 0, maxArgs: 0 },
      move: { minArgs: 2, maxArgs: 2 },
      remove: { minArgs: 1, maxArgs: 1 },
      removeTree: { minArgs: 1, maxArgs: 1 },
      search: { minArgs: 1, maxArgs: 1 },
      update: { minArgs: 2, maxArgs: 2 },
    },
    browserAction: {
      disable: { minArgs: 0, maxArgs: 1, fallbackToNoCallback: true },
      enable: { minArgs: 0, maxArgs: 1, fallbackToNoCallback: true },
      getBadgeBackgroundColor: { minArgs: 1, maxArgs: 1 },
      getBadgeText: { minArgs: 1, maxArgs: 1 },
      getPopup: { minArgs: 1, maxArgs: 1 },
      getTitle: { minArgs: 1, maxArgs: 1 },
      openPopup: { minArgs: 0, maxArgs: 0 },
      setBadgeBackgroundColor: {
        minArgs: 1,
        maxArgs: 1,
        fallbackToNoCallback: true,
      },
      setBadgeText: { minArgs: 1, maxArgs: 1, fallbackToNoCallback: true },
      setIcon: { minArgs: 1, maxArgs: 1 },
      setPopup: { minArgs: 1, maxArgs: 1, fallbackToNoCallback: true },
      setTitle: { minArgs: 1, maxArgs: 1, fallbackToNoCallback: true },
    },
    BrowseData: {
      remove: { minArgs: 2, maxArgs: 2 },
      removeCache: { minArgs: 1, maxArgs: 1 },
      removeCookies: { minArgs: 1, maxArgs: 1 },
      removeDownloads: { minArgs: 1, maxArgs: 1 },
      removeFormData: { minArgs: 1, maxArgs: 1 },
      removeHistory: { minArgs: 1, maxArgs: 1 },
      removeLocalStorage: { minArgs: 1, maxArgs: 1 },
      removePasswords: { minArgs: 1, maxArgs: 1 },
      removePluginData: { minArgs: 1, maxArgs: 1 },
      settings: { minArgs: 0, maxArgs: 0 },
    },
    commands: {
      getAll: { minArgs: 0, maxArgs: 0 },
    },
    contextMenus: {
      remove: { minArgs: 1, maxArgs: 1 },
      removeAll: { minArgs: 0, maxArgs: 0 },
      update: { minArgs: 2, maxArgs: 2 },
      menus: {
        remove: { minArgs: 1, maxArgs: 1 },
        removeAll: { minArgs: 0, maxArgs: 0 },
        update: { minArgs: 2, maxArgs: 2 },
      },
    },
    cookies: {
      get: { minArgs: 1, maxArgs: 1 },
      getAll: { minArgs: 1, maxArgs: 1 },
      getAllCookieStores: { minArgs: 0, maxArgs: 0 },
      remove: { minArgs: 1, maxArgs: 1 },
      set: { minArgs: 1, maxArgs: 1 },
    },
    devtools: {
      inspectedWindow: {
        eval: { minArgs: 1, maxArgs: 2, singleCallbackArg: true },
      },
      panels: {
        create: { minArgs: 3, maxArgs: 3, singleCallbackArg: true },
        elements: {
          createSidebarPane: { minArgs: 1, maxArgs: 1 },
        },
      },
    },
    downloads: {
      cancel: { minArgs: 1, maxArgs: 1 },
      download: { minArgs: 1, maxArgs: 1 },
      erase: { minArgs: 1, maxArgs: 1 },
      getFileIcon: { minArgs: 1, maxArgs: 2 },
      open: { minArgs: 1, maxArgs: 1, fallbackToNoCallback: true },
      pause: { minArgs: 1, maxArgs: 1 },
      removeFile: { minArgs: 1, maxArgs: 1 },
      resume: { minArgs: 1, maxArgs: 1 },
      search: { minArgs: 1, maxArgs: 1 },
      show: { minArgs: 1, maxArgs: 1, fallbackToNoCallback: true },
    },
    extension: {
      isAllowedFileSchemeAccess: { minArgs: 0, maxArgs: 0 },
      isAllowedIncognitoAccess: { minArgs: 0, maxArgs: 0 },
    },
    history: {
      addUrl: { minArgs: 1, maxArgs: 1 },
      deleteAll: { minArgs: 0, maxArgs: 0 },
      deleteRange: { minArgs: 1, maxArgs: 1 },
      deleteUrl: { minArgs: 1, maxArgs: 1 },
      getVisits: { minArgs: 1, maxArgs: 1 },
      search: { minArgs: 1, maxArgs: 1 },
    },
    i18n: {
      detectLanguage: { minArgs: 1, maxArgs: 1 },
      getAcceptLanguages: { minArgs: 0, maxArgs: 0 },
      getUILanguage: { minArgs: 0, maxArgs: 0 },
    },
    identity: {
      launchWebAuthFlow: { minArgs: 1, maxArgs: 1 },
    },
    idle: {
      queryState: { minArgs: 1, maxArgs: 1 },
    },
    management: {
      get: { minArgs: 1, maxArgs: 1 },
      getAll: { minArgs: 0, maxArgs: 0 },
      getSelf: { minArgs: 0, maxArgs: 0 },
      setEnabled: { minArgs: 2, maxArgs: 2 },
      uninstallSelf: { minArgs: 0, maxArgs: 1 },
    },
    notifications: {
      clear: { minArgs: 1, maxArgs: 1 },
      create: { minArgs: 1, maxArgs: 2 },
      getAll: { minArgs: 0, maxArgs: 0 },
      getPermissionLevel: { minArgs: 0, maxArgs: 0 },
      update: { minArgs: 2, maxArgs: 2 },
    },
    pageAction: {
      getPopup: { minArgs: 1, maxArgs: 1 },
      getTitle: { minArgs: 1, maxArgs: 1 },
      hide: { minArgs: 1, maxArgs: 1, fallbackToNoCallback: true },
      setIcon: { minArgs: 1, maxArgs: 1 },
      setPopup: { minArgs: 1, maxArgs: 1, fallbackToNoCallback: true },
      setTitle: { minArgs: 1, maxArgs: 1, fallbackToNoCallback: true },
      show: { minArgs: 1, maxArgs: 1, fallbackToNoCallback: true },
    },
    permissions: {
      contains: { minArgs: 1, maxArgs: 1 },
      getAll: { minArgs: 0, maxArgs: 0 },
      remove: { minArgs: 1, maxArgs: 1 },
      request: { minArgs: 1, maxArgs: 1 },
    },
    runtime: {
      getBackgroundPage: { minArgs: 0, maxArgs: 0 },
      getPlatformInfo: { minArgs: 0, maxArgs: 0 },
      openOptionsPage: { minArgs: 0, maxArgs: 0 },
      requestUpdateCheck: { minArgs: 0, maxArgs: 0 },
      sendMessage: { minArgs: 1, maxArgs: 3 },
      sendNativeMessage: { minArgs: 2, maxArgs: 2 },
      setUninstallURL: { minArgs: 1, maxArgs: 1 },
    },
    sessions: {
      getDevices: { minArgs: 0, maxArgs: 1 },
      getRecentlyClosed: { minArgs: 0, maxArgs: 1 },
      restore: { minArgs: 0, maxArgs: 1 },
    },
    storage: {
      local: {
        clear: { minArgs: 0, maxArgs: 0 },
        get: { minArgs: 0, maxArgs: 1 },
        getBytesInUse: { minArgs: 0, maxArgs: 1 },
        remove: { minArgs: 1, maxArgs: 1 },
        set: { minArgs: 1, maxArgs: 1 },
      },
      managed: {
        get: { minArgs: 0, maxArgs: 1 },
        getBytesInUse: { minArgs: 0, maxArgs: 1 },
      },
      sync: {
        clear: { minArgs: 0, maxArgs: 0 },
        get: { minArgs: 0, maxArgs: 1 },
        getBytesInUse: { minArgs: 0, maxArgs: 1 },
        remove: { minArgs: 1, maxArgs: 1 },
        set: { minArgs: 1, maxArgs: 1 },
      },
    },
    tabs: {
      captureVisibleTab: { minArgs: 0, maxArgs: 2 },
      create: { minArgs: 1, maxArgs: 1 },
      detectLanguage: { minArgs: 0, maxArgs: 1 },
      discard: { minArgs: 0, maxArgs: 1 },
      duplicate: { minArgs: 1, maxArgs: 1 },
      executeScript: { minArgs: 1, maxArgs: 2 },
      get: { minArgs: 1, maxArgs: 1 },
      getCurrent: { minArgs: 0, maxArgs: 0 },
      getZoom: { minArgs: 0, maxArgs: 1 },
      getZoomSettings: { minArgs: 0, maxArgs: 1 },
      goBack: { minArgs: 0, maxArgs: 1 },
      goForward: { minArgs: 0, maxArgs: 1 },
      highlight: { minArgs: 1, maxArgs: 1 },
      insertCSS: { minArgs: 1, maxArgs: 2 },
      move: { minArgs: 2, maxArgs: 2 },
      query: { minArgs: 1, maxArgs: 1 },
      reload: { minArgs: 0, maxArgs: 2 },
      remove: { minArgs: 1, maxArgs: 1 },
      removeCSS: { minArgs: 1, maxArgs: 2 },
      sendMessage: { minArgs: 2, maxArgs: 3 },
      setZoom: { minArgs: 1, maxArgs: 2 },
      setZoomSettings: { minArgs: 1, maxArgs: 2 },
      update: { minArgs: 1, maxArgs: 2 },
    },
    topSites: {
      get: { minArgs: 0, maxArgs: 0 },
    },
    webNavigation: {
      getAllFrames: { minArgs: 1, maxArgs: 1 },
      getFrame: { minArgs: 1, maxArgs: 1 },
    },
    webRequest: {
      handlerBehaviorChanged: { minArgs: 0, maxArgs: 0 },
    },
    windows: {
      create: { minArgs: 0, maxArgs: 1 },
      get: { minArgs: 1, maxArgs: 2 },
      getAll: { minArgs: 0, maxArgs: 1 },
      getCurrent: { minArgs: 0, maxArgs: 1 },
      getLastFocused: { minArgs: 0, maxArgs: 1 },
      remove: { minArgs: 1, maxArgs: 1 },
      update: { minArgs: 2, maxArgs: 2 },
    },
  };
  class DefaultWeakMap extends WeakMap {
    constructor(create, ...args) {
      super(...args);
      this.create = create;
    }
    get(key) {
      if (!this.has(key)) {
        this.set(key, this.create(key));
      }
      return super.get(key);
    }
  }
  const makeCallback = (promise, { fallbackToNoCallback = false } = {}) => {
    let _unwrapped = false;
    const callback = (...args) => {
      if (chrome.runtime.lastError) {
        promise.reject(chrome.runtime.lastError);
      } else if (args.length === 1 && unwrap) {
        promise.resolve(args[0]);
      } else {
        promise.resolve(args);
      }
    };
    Object.defineProperty(callback, "unwrapped", {
      get() {
        return _unwrapped;
      },
      set(unwrapped) {
        if (_unwrapped === unwrapped) {
          return;
        }
        if (unwrapped && fallbackToNoCallback) {
          try {
            promise.resolve(undefined);
          } catch (err) {
            console.error(err);
          }
        }
        _unwrapped = unwrapped;
      },
    });
    return callback;
  };
  const unwrap = Symbol("unwrap");
  const awaitPromise = (getPromise, thisArg, ...args) => {
    const promise = getPromise();
    if (promise) {
      return promise;
    }
    const { resolve, reject, promise: newPromise } = Promise.withResolvers();
    args.push(
      makeCallback(
        { resolve, reject },
        { fallbackToNoCallback: thisArg.fallbackToNoCallback }
      )
    );
    thisArg.raw(...args);
    return newPromise;
  };
  const wrapMethod = (thisArg, method, ...args) => {
    if (method.minArgs > args.length) {
      throw new Error(
        `Expected at least ${method.minArgs} " +
          "parameters for ${thisArg.name}.${method.name}(), got ${args.length}`
      );
    }
    if (method.maxArgs < args.length) {
      throw new Error(
        `Expected at most ${method.maxArgs} " +
          "parameters for ${thisArg.name}.${method.name}(), got ${args.length}`
      );
    }
    const { resolve, reject, promise } = Promise.withResolvers();
    const cb = makeCallback({ resolve, reject }, thisArg);

    if (method.singleCallbackArg) {
      // API methods which have a single callback parameter which is not an
      // array are handled as a special case, the single callback parameter
      // is resolved as the promise fulfillment value.
      cb[unwrap] = true;
    }

    try {
      thisArg.raw(...args, cb);
    } catch (err) {
      if (
        err.message === "Extension context invalidated." &&
        !cb.unwrapped
      ) {
        // As a special case, we resolve with `undefined` for any method which
        // is not expected to be unwrapped, to avoid uncatched promise
        // rejections on this common exception.
        // See https://github.com/mozilla/webextension-polyfill/issues/329
        // for a rationale of this specific behavior.
        resolve(undefined);
      } else {
        reject(err);
      }
    }
    return promise;
  };
  const wrappedMethods = new DefaultWeakMap((name) => {
    return new Proxy(
      {},
      {
        get(target, prop, receiver) {
          if (prop in target) {
            return target[prop];
          }
          if (!(prop in APIS_TO_POLYFILL[name])) {
            return undefined;
          }
          const method = APIS_TO_POLYFILL[name][prop];
          return (target[prop] = wrapMethod.bind(
            null,
            {
              raw: chrome[name][prop],
              name: name,
              fallbackToNoCallback: method.fallbackToNoCallback,
            },
            method
          ));
        },
      }
    );
  });
  const wrappedApis = new DefaultWeakMap((name) => {
    return new Proxy(
      {},
      {
        get(target, prop, receiver) {
          if (prop in target) {
            return target[prop];
          }
          if (!(prop in chrome[name])) {
            return undefined;
          }
          let value = chrome[name][prop];

          if (typeof value === "function") {
            return (target[prop] = new Proxy(value, {
              apply(target, thisArg, args) {
                return awaitPromise(() => value, thisArg, ...args);
              },
            }));
          }

          // These are event handlers which are not wrapped by this polyfill.
          if (typeof value === "object" && "addListener" in value) {
            if (name === "runtime" && prop === "onMessageExternal") {
              // The onMessageExternal event on the chrome.runtime API is a
              // special case, because it is not supported in Firefox.
              //
              // By returning a mock event object when the polyfill is running
              // on a browser that doesn't provide it, we can prevent an
              // exception to be raised when some extension code is trying to
              // attach a listener to it, and prevent a `TypeError: Cannot read
              // properties of undefined (reading 'addListener')` to be raised
              // on the extension background-script console.
              return (target[prop] = {
                addListener() {
                  // This is a mock event object, and so this is an empty no-op
                  // method.
                },
              });
            }
            return (target[prop] = value);
          }

          if (prop in APIS_TO_POLYFILL[name]) {
            return (target[prop] = wrappedMethods.get(name));
          }

          if (name === "i18n" && prop === "getMessage") {
            const getMessage = chrome.i18n.getMessage;
            return (target[prop] = new Proxy(getMessage, {
              apply(target, thisArg, args) {
                const messageName = args[0];
                const message =
                  chrome.i18n.getMessage(messageName, args[1]) ?? messageName;
                if (message !== messageName) {
                  return message;
                }
                const locale = chrome.i18n.getUILanguage();
                const localeShort = locale.split("-", 1)[0];
                const manifest = chrome.runtime.getManifest();
                if (manifest.default_locale) {
                  const defaultLocale = manifest.default_locale;
                  const defaultLocaleShort = defaultLocale.split("-", 1)[0];
                  if (locale !== defaultLocale || localeShort !== defaultLocaleShort) {
                    const l10nFile = `_locales/${locale}/messages.json`;
                    try {
                      const request = new XMLHttpRequest();
                      request.open("GET", l10nFile, false);
                      request.send(null);
                      if (request.status === 200 && request.responseText) {
                        const messages = JSON.parse(request.responseText);
                        if (messages[messageName]) {
                          return messages[messageName].message;
                        }
                      }
                    } catch (e) {}
                  }
                }

                if (!L10N_BROWSER_LOCALE_KEYS.includes(messageName)) {
                  // Fallback for the l10n properties related to the browser locale.
                  if (messageName === "locale") {
                    return locale;
                  }
                  if (messageName === "localeShort") {
                    return localeShort;
                  }
                } else if (!L10N_MESSAGES_KEYS.includes(messageName)) {
                  // Fallback for the l10n properties related to the
                  // extension messages from `_locales/<locale>/messages.json`.
                  if (messageName === "message") {
                    return message;
                  }
                }
                return "";
              },
            }));
          }
          if (name === "runtime" && prop === "getManifest") {
            const getManifest = chrome.runtime.getManifest;
            return (target[prop] = new Proxy(getManifest, {
              apply(target, thisArg, args) {
                const manifest = getManifest();
                if (manifest.browser_specific_settings) {
                  // Remove the browser_specific_settings from the manifest if
                  // the property is defined on it.
                  const { browser_specific_settings, ...rest } = manifest;
                  return rest;
                }
                return manifest;
              },
            }));
          }
          return (target[prop] = value);
        },
      }
    );
  });
  globalThis.browser = new Proxy(
    {},
    {
      get(target, prop, receiver) {
        if (prop in target) {
          return target[prop];
        }
        if (!(prop in chrome)) {
          return undefined;
        }
        return (target[prop] = wrappedApis.get(prop));
      },
    }
  );
}