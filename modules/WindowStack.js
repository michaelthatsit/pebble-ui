// The window stack, as the Application's behavior: push(View, data) slides a
// window in from the right, pop() slides it back out (window_stack_push /
// window_stack_pop). Views are classes from pebble-ui/View, or module names
// imported on demand. The application's data names the home window:
//
//   const App = Application.template($ => ({ behavior: new WindowStack }));
//   export default new App({ View: "main_window" }, { displayListLength: 1024, ... });
//
// It also distributes onMinuteChanged to every content once a minute (the
// StatusBar's clock), and onDisplayed / onUndisplaying to a window's contents
// when it arrives and leaves.
const SLIDE_MS = 250;

class WindowStack extends Behavior {
	constructor() {
		super();
		this.history = [];
		this.view = null;
		WindowStack.current = this;
	}
	onCreate(application, $) {
		this.container = application;
		this.home = $;
		watch.addEventListener("minutechange", () => application.distribute("onMinuteChanged"));
	}
	onDisplaying(container) {
		this.history = [];
		this.display(container, this.make(this.home.View, this.home.data), false);
	}
	make(View, data) {
		if (typeof View === "string")
			View = importNow(View).default;
		return new View(data);
	}
	get depth() {
		return this.history.length;
	}
	display(container, view, backwards) {
		if (this.view) {
			container.first.distribute("onUndisplaying");
			if (!backwards)
				this.history.push(this.view);
			container.run(null);
			container.run(new SlideTransition(backwards), container.first, view.Template, this.view, view);
		}
		else {
			container.add(new view.Template(view, { left: 0, width: container.width, top: 0, height: container.height }));
			container.defer("onScreenDisplayed");
		}
		this.view = view;
	}
	push(View, data) {
		this.container.defer("display", this.make(View, data), false);
	}
	pop(count = 1) {
		if (!this.history.length)
			return;
		let view;
		while (count-- && this.history.length)
			view = this.history.pop();
		this.container.defer("display", view, true);
	}
	onScreenDisplayed(container) {
		container.first.distribute("onDisplayed");
	}
	onTransitionEnded(container) {
		container.purge();
		this.onScreenDisplayed(container);
	}
}
WindowStack.current = null;

// Both windows move together, the new one in from the right (or, popping, from the left).
class SlideTransition extends Transition {
	constructor(backwards) {
		super(SLIDE_MS);
		this.direction = backwards ? -1 : 1;
	}
	onBegin(container, fromScreen, Template, fromView, toView) {
		this.fromScreen = fromScreen;
		this.toScreen = new Template(toView, { left: 0, width: container.width, top: 0, height: container.height });
		if (this.direction < 0)
			container.insert(this.toScreen, fromScreen);
		else
			container.add(this.toScreen);
		this.x = container.x;
		this.width = container.width;
	}
	onStep(fraction) {
		const moved = Math.round(this.width * Math.quadEaseInOut(fraction)) * this.direction;
		this.fromScreen.x = this.x - moved;
		this.toScreen.x = this.x + this.width * this.direction - moved;
	}
	onEnd(container, fromScreen, Template, fromView, toView) {
		container.remove(fromScreen);
		fromView.purge();
	}
}

export default WindowStack;
