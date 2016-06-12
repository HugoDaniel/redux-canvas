import chai from 'chai';
import canvasMiddleware from '../src/index';

let window = { requestAnimationFrame: f => setTimeout(f, 20) }

describe('canvas middleware', () => {
  const doDispatch = () => {};
  const doGetState = () => {};
  const nextHandler = canvasMiddleware(
	                      { dispatch: doDispatch
	                      , getState: doGetState
	                      , window
	                      });
	
  describe('handle next', () => {
    describe('handle action', () => {
      it('must pass action to next', done => {
        const actionObj = {};

        const actionHandler = nextHandler(action => {
          chai.assert.strictEqual(action, actionObj);
          done();
        });

        actionHandler(actionObj);
      });

      it('must call a paint function', done => {
				const paint = function() { done() };
        const actionObj =
				  { meta:
				    { paintOnce: paint
				    }
				  };

        const actionHandler = nextHandler(action => {
					return; // nop
        });

        actionHandler(actionObj);
      });
      it('must register a context', () => {
        const actionObj = { meta: { registerContext: { name: "test", ctx: { myCtx: 123 } } } };

        const actionHandler = nextHandler(action => {
          // chai.assert.strictEqual(action, actionObj);
          done();
        });

        actionHandler(actionObj);
      });

      it('must return value as expected if a function', () => {
        const expected = 'rocks';
        const actionHandler = nextHandler();

        const outcome = actionHandler(() => expected);
        chai.assert.strictEqual(outcome, expected);
      });

      it('must be invoked synchronously if a function', () => {
        const actionHandler = nextHandler();
        let mutated = 0;

        actionHandler(() => mutated++);
        chai.assert.strictEqual(mutated, 1);
      });
    });
  });

  describe('handle errors', () => {
    it('must throw if argument is non-object', done => {
      try {
        canvasMiddleware();
      } catch (err) {
        done();
      }
    });
  });
});
