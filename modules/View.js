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
import Timer from "timer";
import WindowStack from "pebble-ui/WindowStack";

// Long presses, as window_long_click_subscribe: a behavior that sets
//   this.longPress = { select: 700, up: 500, down: 500 }   (ms; any subset)
// in onCreate gets onClickSelect / onLongClickSelect (Up, Down likewise) in
// place of the raw press and release for those buttons. As in the firmware,
// the click fires on release when it was short, the long click when the hold
// reaches the delay. Back cannot be long-pressed (the firmware reserves it).
class ViewBehavior extends Behavior {
	onCreate(container, view) {
		this.view = view;
	}
	press(container, name) {
		const delay = this.longPress && this.longPress[name.toLowerCase()];
		if (delay === undefined)
			return false;
		this.releaseHold();
		this.held = name;
		this.holdTimer = Timer.set(() => {
			this.holdTimer = undefined;
			this.held = undefined;
			container.delegate("onLongClick" + name);
		}, delay);
		return true;
	}
	release(container, name) {
		if (this.held !== name)
			return false;
		this.releaseHold();
		container.delegate("onClick" + name);
		return true;
	}
	releaseHold() {
		if (this.holdTimer !== undefined)
			Timer.clear(this.holdTimer);
		this.holdTimer = undefined;
		this.held = undefined;
	}
	onPressSelect(container) { return this.press(container, "Select"); }
	onReleaseSelect(container) { return this.release(container, "Select"); }
	onPressUp(container) { return this.press(container, "Up"); }
	onReleaseUp(container) { return this.release(container, "Up"); }
	onPressDown(container) { return this.press(container, "Down"); }
	onReleaseDown(container) { return this.release(container, "Down"); }
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
		this.releaseHold();
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
