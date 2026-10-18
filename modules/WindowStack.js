// The window stack, as the Application's behavior: push(View, data) slides a
// window in from the right, pop() slides it back out (window_stack_push /
// window_stack_pop). Views are classes from pebble-ui/View, or module names
// imported on demand. The application's data names the home window:
//
//   const App = Application.template($ => ({ behavior: new WindowStack }));
//   export default new App({ View: "main_window" }, { displayListLength: 2048, ... });
//
// It also distributes onMinuteChanged to every content once a minute (the
// StatusBar's clock), and onDisplayed / onUndisplaying to a window's contents
// when it arrives and leaves.
class WindowStack extends Behavior {
	constructor() {
		super();
		this.going = 0;
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
			if (backwards)
				this.view.runTransitionBackwards(view);
			else {
				this.history.push(this.view);
				view.runTransitionForwards(this.view);
			}
		}
		else {
			container.add(new view.Template(view, { left: 0, width: container.width, top: 0, height: container.height }));
			this.going = 0;
			container.defer("onScreenDisplayed");
		}
		this.view = view;
	}
	push(View, data) {
		const view = this.make(View, data);
		this.going = 1;
		this.container.defer("display", view, false);
	}
	pop(count = 1) {
		if (!this.history.length)
			return;
		let view;
		while (count-- && this.history.length)
			view = this.history.pop();
		this.going = -1;
		this.container.defer("display", view, true);
	}
	popAll() {
		this.pop(this.history.length);
	}
	onScreenDisplayed(container) {
		container.first.distribute("onDisplayed");
	}
	onTransitionEnded(container) {
		container.purge();
		this.going = 0;
		this.onScreenDisplayed(container);
	}
}
WindowStack.current = null;

export default WindowStack;
