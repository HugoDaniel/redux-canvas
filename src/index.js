const canvas = state => {
	if (state === null || typeof state !== "object") {
		throw new Error("canvasMiddleware: state is not an object");
	}
	return next => {
		let frameId = null;
		const { dispatch, getState } = state;
		const contexts = new Map();
		const animations = new Map();
		const paintOnce = [];
		// requestAnimationFrame fallback
		let raf = f => setTimeout(f, 20);
		if (typeof window !== "undefined" && window.requestAnimationFrame) {
			raf = window.requestAnimationFrame;
		}
		function loop(t) {
			if (animations.size > 0) {
				frameId = raf(loop);
			} else {
				frameId = null;
			}
			while (paintOnce.length > 0) {
				const paint = paintOnce.shift();
				paint(t, contexts, getState, dispatch);
			}
			for (const animate of animations.values()) {
				animate(t, contexts, getState, dispatch);
			}
		}

		return action => {
			const result = next(action);
			const m = action.meta || (action.action && action.action.meta);
			if (m) {
				const keys = Object.keys(m);
				for (let i = 0; i < keys.length; i++) {
					switch (keys[i]) {
					case "registerContext":
						if (m.registerContext.ctx === null ||
						    typeof m.registerContext.ctx !== "object" ||
						    typeof m.registerContext.name !== "string") {
							throw new Error(`"registerContext" expects ctx 
							                to be an object and name to be 
							                a string. Got: ${m}`);
						}
						contexts.set(m.registerContext.name,
						             m.registerContext.ctx);
						break;
					case "unregisterContext":
						if (typeof m.unregisterContext !== "string") {
							throw new Error(`unregisterContext expects a string 
							                 Got: ${m}`);
						}
						contexts.delete(m.unregisterContext);
						break;
					case "paintOnce":
						if (typeof m.paintOnce !== "function") {
							throw new Error("paintOnce expects a function");
						}
						paintOnce.push(m.paintOnce);
						break;
					case "startAnim":
						if (typeof m.startAnim.anim !== "function" ||
						   typeof m.startAnim.name !== "string") {
							throw new Error(`startAnim expects anim to be 
							                 a function and name to be a 
							                 string. Got ${m}`);
						}
						animations.set(m.startAnim.name, m.startAnim.anim);
						break;
					case "stopAnim":
						if (typeof m.stopAnim !== "string") {
							throw new Error(`stopAnim expects a string.
							                 Got: ${m}`);
						}
						animations.delete(m.stopAnim);
						break;
					default: continue;
					}
				}
			}
			if (!frameId && (paintOnce.length > 0 || animations.size > 0)) {
				frameId = raf(loop);
			}
			return result;
		};
	};
};
export default canvas;
