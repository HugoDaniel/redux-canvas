# `redux-canvas`

## Motivation
Redux Canvas [middleware](https://github.com/reactjs/redux/blob/master/docs/advanced/Middleware.md) allows you to write action creators that can issue impure painting functions that manipulate one or more [CanvasRenderingContext's](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D).
The functions are stacked in a requestAnimationFrame and happen as soon as the browser allows it. This lets you keep canvas animations and drawing actions in sync with your redux state without the need to go through the DOM or any associated framework (i.e. react).

