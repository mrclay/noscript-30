# NOSCRIPT 30 - September 18th, 2025

The idea: In honor of [JavaScript's upcoming 30th birthday](https://www.webdesignmuseum.org/software/netscape-navigator-2-0-in-1995), NOSCRIPT 30 (tentative name) will be an exhibition of web-based interactive games built with _no browser scripting_.

## HTML5 Category

Games in this category aim to be accessible in modern desktop and mobile browsers. They should be interactive and the browser must not load any resources that embed or allow scripting or pre-programmed elements (no `script`, no `on*` attributes, no service workers, no browser extensions, no `object`, `embed`, `applet`, or obscure scripting facilities). Users will have JavaScript enabled, so built-in browser-triggered events will fire, but must not be handled.

## 1995 Category

These games should work in browsers available before JavaScript's introduction in 1995, notably Netscape Navigator 1.0, Internet Explorer 1.0, Mosaic 1.0, or MultiTorg Opera 1.0.

## Play an example

```
git clone https://github.com/mrclay/noscript-30.git
cd noscript-30/express
npm ci
npm run start
```

Then open http://localhost:3000/

## Tech that may be of use

- [`<meta http-equiv="refresh" content="1">`](https://en.wikipedia.org/wiki/Meta_refresh) allows 1FPS "animation" (with better effects via CSS).
- [Streaming HTML to an `iframe`](https://dev.to/tigt/the-weirdly-obscure-art-of-streamed-html-4gc2) allows you to stack "frames" of content so the latest is always visible (as the document increases in length--points off for crashing the browser).
- [express-session](https://www.npmjs.com/package/express-session), [PHP sessions](https://www.php.net/manual/en/session.examples.basic.php), etc.
- Links and forms can send user selections, including to named `iframe` elements  
- [CSS state machines](https://css-tricks.com/a-complete-state-machine-made-with-html-checkboxes-and-css/)
