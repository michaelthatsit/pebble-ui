// Menus with accessories, after the SDK's checkbox and radio button patterns.
//
//   new CheckboxList({ items: ["Choice 0", ...], checked: [false, ...], submit: "Submit",
//                      onSubmit(checked) {...} })
//   new RadioList({ items: [...], choice: 0, submit: "Submit", onSubmit(choice) {...} })
//
// Both are Menus (pebble-ui/Menu): Select toggles or picks a row, and on the
// submit row (left out when `submit` is null) calls onSubmit. The accessories
// are drawn as the C SDK draws them: a 12 px box with a 16 px tick, and
// anti-aliased circles of radius 6 and 3, in white on the highlighted row.
import { GColor } from "pebble-ui/sdk";
import Menu, { MenuTitle, MenuItem } from "pebble-ui/Menu";

// Checkbox: a 12 px box at x = width - 2 * BOX, vertically centred, with the
// 16 px tick drawn from 3 px above the box. One Port, 16 x 18, holds both.
const BOX = 12;
// tick_black.png from pebble-examples/ui-patterns, 16 x 16, a row per hex word (bit 15 is the left pixel)
const TICK = "0000 0000 0004 000E 001F 003E 607C F0F8 F9F0 7FE0 3FC0 1F80 0F00 0600 0000 0000".split(" ");
// Radio: graphics_draw_circle(6) and graphics_fill_circle(3) as the firmware
// anti-aliases them, as coverage levels (0: none, 3: full), sampled from the C app.
const RADIUS = 6;
const DIAMETER = 2 * RADIUS + 1;
const RING = [
	"0001233321000",
	"0032100012300",
	"0210000000120",
	"1200000000021",
	"2100000000012",
	"3000000000003",
	"3000000000003",
	"3000000000003",
	"2100000000012",
	"1200000000021",
	"0210000000120",
	"0032100012300",
	"0001233321000",
];
const DOT = [
	"0033300",
	"1333331",
	"2333332",
	"3333333",
	"2333332",
	"1333331",
	"0033300",
];
const INK_LEVELS = ["#FFFFFF", "#AAAAAA", "#555555", "#000000"];
const PAPER_LEVELS = ["#000000", "#555555", "#AAAAAA", "#FFFFFF"];

function drawTable(port, levels, rows, left, top) {
	for (let y = 0; y < rows.length; y++) {
		const row = rows[y];
		for (let x = 0; x < row.length; x++) {
			const level = row.charCodeAt(x) - 48;
			if (level)
				port.fillColor(levels[level], left + x, top + y, 1, 1);
		}
	}
}

// A row's accessory is its last content, a Port the list draws into; it is
// placed from the row's height (which changes with the selection on round)
// and redrawn on every reload.
class AccessoryBehavior extends Behavior {
	onCreate(port, $) {
		this.$ = $;
	}
	onDraw(port) {
		const menu = this.$.menu;
		menu.drawAccessory(port, this.highlighted, menu.isOn(this.$.index));
	}
}

class RowBehavior extends Behavior {
	onCreate(row, $) {
		this.$ = $;
	}
	onReload(row, highlighted, height) {
		const port = row.last;
		port.coordinates = this.$.menu.accessoryFrame(height);
		port.behavior.highlighted = highlighted;
		port.invalidate();
	}
}

const ListRow = Container.template($ => ({
	left: 0, right: 0, Behavior: RowBehavior,
	contents: [
		MenuTitle($),
		Port($, { right: 0, top: 0, width: 1, height: 1, Behavior: AccessoryBehavior }),
	],
}));

function listData(data) {
	const items = data.items.map(item => typeof item === "string" ? { title: item } : item);
	const count = items.length;
	if (data.submit !== null)
		items.push({ title: data.submit ?? "Submit", submit: true });
	return {
		...data, items,
		Item: function($, it) { return $.index < count ? ListRow($, it) : MenuItem($, it); }, // a function, not an arrow: Menu calls it with new
		onSelect: undefined,
	};
}

class ListBehavior extends Menu.Behavior {
	onSelect(menu, index, item) {
		const view = this.view;
		if (item.submit) {
			if (view.data.onSubmit)
				view.data.onSubmit(view.value);
		}
		else {
			view.pick(index);
			if (view.data.onChange)
				view.data.onChange(index, view.isOn(index));
			this.reload(menu);
		}
		return true;
	}
}

export class CheckboxList extends Menu {
	static get Behavior() { return ListBehavior }
	constructor(data) {
		super(listData(data));
		this.checked = data.checked ? data.checked.slice() : new Array(data.items.length).fill(false);
	}
	get value() {
		return this.checked;
	}
	isOn(index) {
		return this.checked[index];
	}
	pick(index) {
		this.checked[index] = !this.checked[index];
	}
	// The box at (width - 2 * BOX, height / 2 - BOX / 2); the port starts 3 px above it.
	accessoryFrame(height) {
		return { right: 2 * BOX - 16, top: (height >> 1) - (BOX >> 1) - 3, width: 16, height: BOX + 6 };
	}
	drawAccessory(port, highlighted, on) {
		const color = highlighted ? GColor.White : GColor.Black;
		// graphics_draw_rect: the one pixel outline of the box, 3 px down
		port.fillColor(color, 0, 3, BOX, 1);
		port.fillColor(color, 0, 3 + BOX - 1, BOX, 1);
		port.fillColor(color, 0, 3, 1, BOX);
		port.fillColor(color, BOX - 1, 3, 1, BOX);
		if (!on)
			return;
		for (let y = 0; y < TICK.length; y++) {
			const bits = parseInt(TICK[y], 16);
			for (let x = 0; x < 16;) {
				if (bits & (0x8000 >> x)) {
					let end = x;
					while (end < 16 && (bits & (0x8000 >> end))) end++;
					port.fillColor(color, x, y, end - x, 1);
					x = end;
				}
				else
					x++;
			}
		}
	}
}

export class RadioList extends Menu {
	static get Behavior() { return ListBehavior }
	constructor(data) {
		super(listData(data));
		this.choice = data.choice ?? 0;
	}
	get value() {
		return this.choice;
	}
	isOn(index) {
		return this.choice === index;
	}
	pick(index) {
		this.choice = index;
	}
	// The circle centred at (width - 3 * RADIUS, height / 2).
	accessoryFrame(height) {
		return { right: 3 * RADIUS - RADIUS - 1, top: (height >> 1) - RADIUS, width: DIAMETER, height: DIAMETER };
	}
	drawAccessory(port, highlighted, on) {
		const levels = highlighted ? PAPER_LEVELS : INK_LEVELS;
		drawTable(port, levels, RING, 0, 0);
		if (on)
			drawTable(port, levels, DOT, RADIUS - 3, RADIUS - 3);
	}
}
