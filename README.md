# `redux-canvas`

## Motivation

Redux Canvas [middleware](https://github.com/reactjs/redux/blob/master/docs/advanced/Middleware.md) allows you to write action creators that can issue impure painting functions to manipulate one or more [CanvasRenderingContext's](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D).
These painting functions are then stacked in a requestAnimationFrame and run as soon as the browser allows it. This lets you keep canvas animations and drawing actions in sync with your redux state&actions without the need to go first through the DOM or any associated framework (i.e. react).

An action creator that uses a function to perform an action on a canvas context:

For more info [please read this blog post](http://www.hugodaniel.pt/posts/2016-06-17-react-redux-canvas.html)

```js
const INIT_ALERT = "INIT_ALERT";
const RED_ALERT = "RED_ALERT";

// the actual painting function that works on the canvas context
// t is the requestAnimationFrame argument
// contexts is the Map() of all registered canvas contexts
// getState is the redux store state getter
// dispatch is the redux store state updater
function paintSquare(t, contexts, getState, dispatch) {
  const ctx = contexts.get("alert");
  ctx.fillStyle = "red";
  ctx.fillRect(0,0,50,50);
}

// the redux action to register a context 
// (you can call it after a canvas is mounted)
// this also clears the context by specifying a function in "paintOnce" 
// (though you can just register it and do the painting later).
function initAlertCanvas(ctx) {
  return
    { type: INIT_ALERT
    , meta: 
      { registerContext: { name: "alert", ctx }
      , paintOnce: (t, contexts) => contexts.get("alert").clearRect(0,0,800,600)
      }
    };
}

// then the redux paint action
// (in this example a red alert could be issued when something bad happens)
function redAlertAction(world) {
  return 
    { type: RED_ALERT
    , world: update(world) // your redux state update action
    , meta: { paintOnce: paintSquare }
    // ^ requestAnimationFrame will be called after the action has run
    };
}
```

## Installation

```
npm install --save redux-canvas
```

Then, to enable Redux Canvas, use [`applyMiddleware()`](http://redux.js.org/docs/api/applyMiddleware.html):

```js
import { createStore, applyMiddleware } from "redux";
import canvas from "redux-canvas";
import rootReducer from "./reducers/index";

// Note: this API requires redux@>=3.1.0
const store = createStore(
  rootReducer,
  applyMiddleware(canvas)
);
```


## License

WTFPL

