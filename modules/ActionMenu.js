// An ActionMenu (action_menu_open): a black sheet with a coloured rail at the
// left (a ring on round), the actions in Gothic 24 Bold with the selected one
// in the foreground colour and the others dimmed. Up/Down move, Select closes
// the menu and then runs the action, Back closes it.
//
//   WindowStack.current.push(ActionMenu, {
//     items: ["Start Workout", "Start Live"], background: GColor.IslamicGreen,
//     onSelect(index, item) {...} })
//
// Measured against the firmware on the emulators: a 16 px rail with a 5 px
// crumb dot at (6, 10) on rect, a 14 px ring on round; items 47 px apart on
// rect with the group placed from the screen's middle, and on round the
// selected item centred with the others 33 px apart (68 px for the selected).
import { ROUND, GColor, FONT_KEY, colorLevels, blendToBlack } from "pebble-ui/sdk";
import Timer from "timer";
import View from "pebble-ui/View";
import WindowStack from "pebble-ui/WindowStack";

const RAIL = 16;
const RING = 14;
const TEXT_LEFT = 26;
const PITCH = 47;
const HALF_PITCH = 18; // the group moves up this much per item (measured)
const ROUND_FOCUSED = 68;
const ROUND_UNFOCUSED = 33;
const REPEAT_DELAY_MS = 400;
const REPEAT_MS = 100;

// The crumb: a 5 px anti-aliased dot, its corners two thirds of the way from
// the rail's colour to the dot's (measured).
class CrumbBehavior extends Behavior {
	onCreate(port, $) {
		this.color = $.foreground;
		this.corner = blendToBlack(colorLevels($.background), 2 / 3, colorLevels($.foreground));
	}
	onDraw(port) {
		port.fillColor(this.color, 1, 0, 3, 1);
		port.fillColor(this.color, 1, 1, 3, 3);
		port.fillColor(this.color, 0, 2, 5, 1);
		port.fillColor(this.color, 1, 4, 3, 1);
		for (const [x, y] of [[0, 1], [4, 1], [0, 3], [4, 3]])
			port.fillColor(this.corner, x, y, 1, 1);
	}
}

// Round: the black inside of the ring, drawn row by row so its edge is crisp
// like the firmware's (a RoundRect's would be anti-aliased).
class RoundInsideBehavior extends Behavior {
	onDraw(port) {
		const w = port.width, h = port.height, cx = w / 2, cy = h / 2, r = cx - RING;
		for (let y = 0; y < h; y++) {
			const dy = y + 0.5 - cy;
			if (Math.abs(dy) >= r)
				continue;
			const half = Math.sqrt(r * r - dy * dy);
			const x0 = Math.round(cx - half), x1 = Math.round(cx + half);
			port.fillColor(GColor.Black, x0, y, x1 - x0, 1);
		}
	}
}

class ActionMenuBehavior extends View.Behavior {
	onDisplaying(container) {
		this.place(container);
	}
	onUndisplaying(container) {
		this.release();
		super.onUndisplaying(container);
	}
	place(container) {
		const view = this.view, n = view.items.length, selection = view.selection;
		const height = container.height || screen.height, middle = height >> 1;
		// rect: the group starts HALF_PITCH per item above the middle; when it
		// does not fit, it scrolls to centre the selection, clamped to its end
		// (the MenuLayer rule).
		let first = middle - HALF_PITCH * n;
		const bottom = first + PITCH * n;
		if (!ROUND && bottom > height)
			first -= Math.max(0, Math.min(first + PITCH * selection + (PITCH >> 1) - middle, bottom - height));
		let label = container.content(2);
		for (let i = 0; label; i++, label = label.next) {
			let top;
			if (ROUND) {
				// the selected item's box centred in a 68 px cell, the others in 33 px cells above and below
				if (i === selection)
					top = middle - (ROUND_FOCUSED >> 1) + ((ROUND_FOCUSED - 34) >> 1);
				else if (i > selection)
					top = middle + (ROUND_FOCUSED >> 1) + (i - selection - 1) * ROUND_UNFOCUSED;
				else
					top = middle - (ROUND_FOCUSED >> 1) - (selection - i) * ROUND_UNFOCUSED - 1;
			}
			else
				top = first + PITCH * i;
			label.coordinates = ROUND ? { left: 0, right: 0, top, height: 30 } : { left: TEXT_LEFT, right: 0, top, height: 30 };
			label.state = i === selection ? 1 : 0;
			// round: a cell that does not fit the screen is not drawn
			label.visible = !ROUND || (top >= 0 && top + ROUND_UNFOCUSED <= height);
		}
	}
	step(container, direction) {
		const view = this.view;
		const selection = Math.max(0, Math.min(view.items.length - 1, view.selection + direction));
		if (selection === view.selection)
			return;
		view.selection = selection;
		this.place(container);
	}
	pressStep(container, direction) {
		this.step(container, direction);
		this.timer = Timer.set(() => this.step(container, direction), REPEAT_DELAY_MS, REPEAT_MS);
		return true;
	}
	release() {
		if (this.timer !== undefined)
			Timer.clear(this.timer);
		this.timer = undefined;
		return true;
	}
	onPressUp(container) { return this.pressStep(container, -1); }
	onPressDown(container) { return this.pressStep(container, 1); }
	onReleaseUp(container) { return this.release(); }
	onReleaseDown(container) { return this.release(); }
	onPressSelect(container) {
		const view = this.view, index = view.selection, item = view.items[index];
		WindowStack.current.pop(1, () => {
			if (item.onSelect)
				item.onSelect(index, item);
			else if (view.data.onSelect)
				view.data.onSelect(index, item);
		});
		return true;
	}
}

const ActionMenuContainer = Container.template($ => ({
	skin: new Skin({ fill: GColor.Black }), Behavior: $.constructor.Behavior,
	contents: [
		ROUND
			? Content($, { left: 0, right: 0, top: 0, bottom: 0, skin: new Skin({ fill: $.background }) })
			: Content($, { left: 0, width: RAIL, top: 0, bottom: 0, skin: new Skin({ fill: $.background }) }),
		ROUND
			? Port($, { left: 0, right: 0, top: 0, bottom: 0, Behavior: RoundInsideBehavior })
			: Port($, { left: 6, top: 10, width: 5, height: 5, Behavior: CrumbBehavior }),
		...$.items.map(item => Label($, { left: TEXT_LEFT, right: 0, top: 0, height: 30, style: $.style, string: item.title })),
	],
}));

export default class ActionMenu extends View {
	static get Behavior() { return ActionMenuBehavior }
	constructor(data) {
		super(data);
		this.items = data.items.map(item => typeof item === "string" ? { title: item } : item);
		this.selection = data.selection ?? 0;
		this.background = data.background ?? GColor.White;
		this.foreground = data.foreground ?? GColor.White;
		this.style = new Style({ font: FONT_KEY.GOTHIC_24_BOLD, color: [GColor.DarkGray, this.foreground], horizontal: ROUND ? "center" : "left", vertical: "top", top: 4 });
	}
	get Template() { return ActionMenuContainer }
}
