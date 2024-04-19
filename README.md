# NOSCRIPT 30 - September 18th, 2025

The idea: In honor of [JavaScript's upcoming 30th birthday](https://www.webdesignmuseum.org/software/netscape-navigator-2-0-in-1995), NOSCRIPT 30 (tentative name) will be an exhibition of web-based interactive games built with _no browser scripting_.

## HTML5 Category

Games in this category aim to be accessible in modern desktop and mobile browsers. They should be interactive and the browser must not load any resources that allow scripting or pre-programmed elements (no service workers, no `object`, no `embed`, no `applet`, no browser extensions, no obscure scripting facilities). Users will have JavaScript enabled, so built-in browser-triggered events will fire, but must not be handled.

## 1995 Category

These games should work in browsers available before JavaScript's introduction in 1995, notably Netscape Navigator 1.0, Internet Explorer 1.0, Mosaic 1.0, or MultiTorg Opera 1.0.

## Tech that may be of use

- [`<meta http-equiv="refresh" content="1">`](https://en.wikipedia.org/wiki/Meta_refresh) should allow 1FPS "animation" (with better effects via CSS).
- In theory, [streaming HTML to an `iframe`](https://dev.to/tigt/the-weirdly-obscure-art-of-streamed-html-4gc2) should allow you to control the visible area (though the document will increase in length).
- [express-session](https://www.npmjs.com/package/express-session), [PHP sessions](https://www.php.net/manual/en/session.examples.basic.php), etc.
- Links and forms can send user selections, including to named `iframe` elements  
