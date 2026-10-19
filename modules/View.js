// A View is a window: its Template builds the screen, its Behavior handles the
// buttons (onPressUp/Down/Select/Back and the matching onRelease, delivered to
// the focused content and up through its containers; return true to stop).
// Back pops the window when there is one below; on the bottom window it is
// left unhandled, so the firmware closes the app, as the C SDK does.
//
//   class MyBehavior extends View.Behavior { onPressSelect(container) { ...; return true; } }
//   const MyScreen = Container.template($ => ({ skin, Behavior: $.constructor.Behavior, contents: [...] }));
//   export default class MyWindow extends View {
//     static get Behavior() { return MyBehavior }
//     get Template() { return MyScreen }
//   }
import WindowStack from "pebble-ui/WindowStack";

class ViewBehavior extends Behavior {
	onCreate(container, view) {
		this.view = view;
	}
	onDisplayed(container) {
		container.focus();
	}
	onPressBack(container) {
		const stack = WindowStack.current;
		if (stack && stack.depth) {
			stack.pop();
			return true;
		}
	}
	onUndisplaying(container) {
		const stack = WindowStack.current;
		if (stack)
			stack.container.focus();
	}
}

class View {
	static get Behavior() { return ViewBehavior }
	constructor(data = {}) {
		this.data = data;
	}
	// Drops the view's references to Piu contents, so a view in history holds no screen.
	purge() {
		for (const key in this)
			if (this[key] instanceof Content) delete this[key];
	}
}

Object.freeze(View);

export default View;
