// Long presses, as window_long_click_subscribe gives them. A window behavior
// that extends LongPressBehavior and sets
//   this.longPress = { select: 700, up: 500, down: 500 }   (ms; any subset)
// in onCreate gets onClickSelect / onLongClickSelect (Up, Down likewise) in
// place of the raw press and release for those buttons. As in the firmware,
// the click fires on release when it was short, the long click when the hold
// reaches the delay. Back cannot be long-pressed (the firmware reserves it).
import Timer from "timer";
import View from "pebble-ui/View";

export class LongPressBehavior extends View.Behavior {
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
	onUndisplaying(container) {
		this.releaseHold();
		super.onUndisplaying(container);
	}
}

export default LongPressBehavior;
