import chai from "chai";
import canvasMiddleware from "../src/index";

describe("canvas middleware", () => {
  const doDispatch = () => {};
  const doGetState = () => {};
  const nextHandler = canvasMiddleware(
	                      { dispatch: doDispatch
	                      , getState: doGetState
	                      });
	
	describe("handle action", () => {
		it("must pass action to next", done => {
			const actionObj = {};

			const actionHandler = nextHandler(action => {
				chai.assert.strictEqual(action, actionObj);
				done();
			});

			actionHandler(actionObj);
		});
	});

	describe("paint & contexts", () => {
		it("must call a paint function", done => {
			const paint = () => done();
			const actionObj = { meta: { paintOnce: paint } };
			const actionHandler = nextHandler(action => { return; });
			actionHandler(actionObj);
		});
		it("must call the second paint action " + 
		   "if the frame of the first paint has already finished", done => {
			const paint1 = () => null;
			const paint2 = () => done();
			const action1 = { meta: { paintOnce: paint1 } };
			const action2 = { meta: { paintOnce: paint2 } };
 			const actionHandler = nextHandler(action => { return; });

			actionHandler(action1);
			setTimeout(a => actionHandler(action2), 40)
		});
		it("must register a context", done => {
			const withContext = function(t, ctx) { 
				chai.assert.strictEqual(typeof ctx, "object", 
					"Contexts Map is not an object, its typeof is " + (typeof ctx));
				chai.assert.strictEqual(typeof ctx.get, "function", 
					"Contexts Map does not have a get function");
				chai.assert.strictEqual(typeof ctx.get("test"), "object", 
						"Contexts Map does not have the registered 'test' context");
				chai.assert.strictEqual(typeof ctx.get("test").myCtx, "number", 
					"The registered context is of the wrong type");
				chai.assert.strictEqual(ctx.get("test").myCtx, 123, 
					"The context provided has different values from the registered one");
				done();
			};
			const actionObj =
				{ meta:
					{ paintOnce: withContext
					, registerContext: { name: "test", ctx: { myCtx: 123 } }
					}
				};
			const actionHandler = nextHandler(action => { return; });
			actionHandler(actionObj);
		});
		it("must persist register a context between actions", done => {
			const checkContext = function(t, ctx) { 
				chai.assert.strictEqual(typeof ctx, "object", 
					"Contexts Map is not an object, its typeof is " + (typeof ctx));
				chai.assert.strictEqual(typeof ctx.get, "function", 
					"Contexts Map does not have a get function");
				chai.assert.strictEqual(typeof ctx.get("persisted"), "object", 
					"Contexts Map does not have the registered 'persisted' context");
				done();
			};
 			const action1 =
				{ meta:
					{ registerContext: { name: "persisted", ctx: { stuff: "ok" } }
					}
				};
			const action2 = { meta: { paintOnce: checkContext } };
			const actionHandler = nextHandler(action => { return; });
			actionHandler(action1);
			actionHandler(action2);
		});
		it("must call a multiple paint functions by the order they were issued", done => {
			const paint1 = function(t, ctx) { 
				const order = ctx.get("orderly");
				chai.assert.strictEqual(order.isPaint1Done, false,
				"Paint1 has already been done" );
				chai.assert.strictEqual(order.isPaint2Done, false,
				"Paint2 has happened before Paint1" );
				chai.assert.strictEqual(order.isPaint3Done, false,
				"Paint3 has happened before Paint1" );
				order.isPaint1Done = true;
			};
			const paint2 = function(t, ctx) { 
				const order = ctx.get("orderly");
				chai.assert.strictEqual(order.isPaint1Done, true,
				"Paint1 has not happened before Paint2" );
				chai.assert.strictEqual(order.isPaint2Done, false,
				"Paint2 has already been done");
				chai.assert.strictEqual(order.isPaint3Done, false,
				"Paint3 has happened before Paint2" );
				order.isPaint2Done = true;
			};
			const paint3 = function(t, ctx) { 
				const order = ctx.get("orderly");
				chai.assert.strictEqual(order.isPaint1Done, true,
				"Paint1 has not happened before Paint3" );
				chai.assert.strictEqual(order.isPaint2Done, true,
				"Paint2 has not happened before Paint3" );
				chai.assert.strictEqual(order.isPaint3Done, false,
				"Paint3 has already been done");
				order.isPaint3Done = true;
				done();
			};
       const action1 =
				{ meta:
					{ registerContext: 
						{ name: "orderly", ctx: 
							{ isPaint1Done: false
							, isPaint2Done: false
							, isPaint3Done: false
							} 
						}
					}
				};
			const action2 = { meta: { paintOnce: paint1 } };
			const action3 = { meta: { paintOnce: paint2 } };
			const action4 = { meta: { paintOnce: paint3 } };
			const actionHandler = nextHandler(action => { return; });
			actionHandler(action1);
			actionHandler(action2);
			actionHandler(action3);
			actionHandler(action4);
		});
		it("must unregister a context", done => {
			const withContext = function(t, ctx) {
				chai.assert.strictEqual(typeof ctx.get("unregisterMe"), "object",
					"Contexts Map does not have the registered 'unregisterMe' context");
			};
			const checkUnregistered = function(t, ctx) {
				chai.assert.strictEqual(typeof ctx.get("unregisterMe"), "undefined",
					"Contexts Map still has the registered 'unregisterMe' context");
				done();
			};
			const action1 =
				{ meta:
					{ registerContext: { name: "unregisterMe", ctx: { a: "b" } }
					}
			  };
			const action2 = { meta: { paintOnce: withContext } };
			const action3 = { meta: { unregisterContext: "unregisterMe" } };
			const action4 = { meta: { paintOnce: checkUnregistered } };
			const actionHandler = nextHandler(action => { return; });
			actionHandler(action1);
			actionHandler(action2);
			setTimeout(a => actionHandler(action3), 20);
			setTimeout(a => actionHandler(action4), 40);
		});
	});
	describe("animations", () => {
		it("must run an animation", done => {
			const atLeast3 = function(t, ctx) {
				const a = ctx.get("animation");
				// after 3 frames its ok to stop the test
				if(a.frames === 3) done();
				// update the context:
				a.frames = a.frames + 1;
				ctx.set("animation", a);
			};
			const action1 =
				{ meta:
					{ registerContext: { name: "animation", ctx: { frames: 0 } }
					}
				};
			const action2 =
				{ meta: { startAnim: { name: "atLeast3", anim: atLeast3 } } };
			const actionHandler = nextHandler(action => { return; });
			actionHandler(action1);
			setTimeout(() => actionHandler(action2), 20);
		});

		it("must paint while running an animation", done => {
			const infiniteAnim = function(t, ctx) {
				const a = ctx.get("animation");
				a.frames = a.frames + 1;
				if(!a.isRunning) a.isRunning = true;
				ctx.set("animation", a);
			};
			const paint = function(t, ctx) {
				const a = ctx.get("animation");
				chai.assert.isOk(a.isRunning, "Animation is not running");
				chai.assert.isOk(a.frames > 0, "Animation did not run for a few frames");
				done(); // paint action sets this flag (see bellow)
			};
			const action1 =
				{ meta:
					{ registerContext: 
						{ name: "animation", ctx: 
							{ frames: 0, isRunning: false } 
						}
					}
				};
			const action2 =
				{ meta:
			    { startAnim: { name: "infinite", anim: infiniteAnim }
			    }
			  };
			const action3 = { meta: { paintOnce: paint } };
			const actionHandler = nextHandler(action => { return; });

			actionHandler(action1);
			actionHandler(action2);
			setTimeout(() => actionHandler(action3), 20);
		});
		it("must stop an animation", done => {
			// make two animations run at the same time
			// compare their frames while running
			// stop one animation and from the other check if the frame count
			// is higher
			const infiniteAnim = function(t, ctx) {
				const a = ctx.get("animation");
				if(a.hasBeenEqual && a.infiniteFrames > a.stopFrames) {
					done();
				}
				a.hasBeenEqual = (a.infiniteFrames === a.stopFrames) && a.stopFrames > 0;
				a.infiniteFrames += 1;
			};
			const animToStop = function(t, ctx) {
				const a = ctx.get("animation");
				a.stopFrames += 1;
			};
			const action1 =
				{ meta:
					{ registerContext: 
						{ name: "animation", ctx: 
							{ infiniteFrames: 0, stopFrames: 0, hasBeenEqual: false }
						}
					}
				};
			const action2 =
				{ meta:
			    { startAnim: { name: "infiniteAnim", anim: infiniteAnim }
			    }
			  };
			const action3 =
				{ meta:
			    { startAnim: { name: "stopAnim", anim: animToStop }
			    }
			  };
			const action4 = { meta: { stopAnim: "stopAnim" } };
			const actionHandler = nextHandler(action => { return; });

			actionHandler(action1);
			setTimeout(() => { actionHandler(action2); actionHandler(action3); return; }, 10);
			setTimeout(() => actionHandler(action4), 50);
		});
	});

  describe("handle errors", () => {
		it("must throw if argument is non-object", done => {
			try {
				canvasMiddleware();
			} catch (err) {
				done();
			}
		});
		it("must throw if paintOnce is not a function", done => {
			const action1 = { meta: { paintOnce: "" } };
			const actionHandler = nextHandler(action => { return; });
			try { actionHandler(action1); } catch (e1) {
				action1.meta.paintOnce = {};
				try { actionHandler(action1); } catch (e2) {
					action1.meta.paintOnce = null;
					try { actionHandler(action1); } catch (e2) {
						done();
					}
				}
			}
		});
		it("must throw if registerContext ctx is not an object ", done => {
			const action1 = { meta: { registerContext: { name: "boom", ctx: null } } };
			const actionHandler = nextHandler(action => { return; });
			try { actionHandler(action1); } catch (e1) {
				action1.meta.registerContext.ctx = "";
				try { actionHandler(action1); } catch (e2) {
					action1.meta.registerContext.ctx = 123;
					try { actionHandler(action1); } catch (e3) {
						action1.meta.registerContext.ctx = () => 123;
						try { actionHandler(action1); } catch (e4) {
							done();
						}
					}
				}
			}
		});

		it("must throw if registerContext name is not a string", done => {
			const action1 = { meta: { registerContext: { name: null, ctx: {} } } };
			const actionHandler = nextHandler(action => { return; });
			try { actionHandler(action1); } catch (e1) {
				action1.meta.registerContext.name = {};
				try { actionHandler(action1); } catch (e2) {
					action1.meta.registerContext.name = 123;
					try { actionHandler(action1); } catch (e3) {
						action1.meta.registerContext.name = () => 123;
						try { actionHandler(action1); } catch (e4) {
							done();
						}
					}
				}
			}
		});

		it("must throw if unregisterContext is not a string", done => {
			const action1 = { meta: { unregisterContext: null } };
			const actionHandler = nextHandler(action => { return; });
			try { actionHandler(action1); } catch (e1) {
				action1.meta.unregisterContext = {};
				try { actionHandler(action1); } catch (e2) {
					action1.meta.unregisterContext = 123;
					try { actionHandler(action1); } catch (e3) {
						action1.meta.unregisterContext = () => 123;
						try { actionHandler(action1); } catch (e4) {
							done();
						}
					}
				}
			}
		});

		it("must throw if startAnim name is not a string", done => {
			const action1 = { meta: { startAnim: { name: null, anim: () => 123 } } };
			const actionHandler = nextHandler(action => { return; });
			try { actionHandler(action1); } catch (e1) {
				action1.meta.startAnim.name = {};
				try { actionHandler(action1); } catch (e2) {
					action1.meta.startAnim.name = 123;
					try { actionHandler(action1); } catch (e3) {
						action1.meta.startAnim.name = () => 123;
						try { actionHandler(action1); } catch (e4) {
							done();
						}
					}
				}
			}
		});

		it("must throw if startAnim anim is not a function", done => {
			const action1 = { meta: { startAnim: { name: "", anim: null } } };
			const actionHandler = nextHandler(action => { return; });
			try { actionHandler(action1); } catch (e1) {
				action1.meta.startAnim.anim = {};
				try { actionHandler(action1); } catch (e2) {
					action1.meta.startAnim.anim = 123;
					try { actionHandler(action1); } catch (e3) {
						action1.meta.startAnim.anim = "";
						try { actionHandler(action1); } catch (e4) {
							done();
						}
					}
				}
			}
		});

		it("must throw if stopAnim is not a string", done => {
			const action1 = { meta: { stopAnim: null } };
			const actionHandler = nextHandler(action => { return; });
			try { actionHandler(action1); } catch (e1) {
				action1.meta.stopAnim = {};
				try { actionHandler(action1); } catch (e2) {
					action1.meta.stopAnim = 123;
					try { actionHandler(action1); } catch (e3) {
						action1.meta.stopAnim = () => 123;
						try { actionHandler(action1); } catch (e4) {
							done();
						}
					}
				}
			}
		});
	});
});
