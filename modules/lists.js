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

// Checkbox: the box at x = width - 2 * BOX, vertically centred; the tick 3 px above it.
const BOX = 12;
const TICK = [ // tick_black.png from pebble-examples/ui-patterns, 16 x 16
	"0000000000000000",
	"0000000000000000",
	"0000000000000100",
	"0000000000001110",
	"0000000000011111",
	"0000000000111110",
	"0110000001111100",
	"1111000011111000",
	"1111100111110000",
	"0111111111100000",
	"0011111111000000",
	"0001111110000000",
	"0000111100000000",
	"0000011000000000",
	"0000000000000000",
	"0000000000000000",
];
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

class AccessoryBehavior extends Behavior {
	onCreate(port) {
		this.highlighted = false;
		this.on = false;
	}
}

class TickBehavior extends AccessoryBehavior {
	onDraw(port) {
		if (!this.on)
			return;
		const color = this.highlighted ? GColor.White : GColor.Black;
		for (let y = 0; y < TICK.length; y++) {
			const row = TICK[y];
			for (let x = 0; x < row.length;) {
				if (row[x] === "1") {
					let end = x;
					while (row[end] === "1") end++;
					port.fillColor(color, x, y, end - x, 1);
					x = end;
				}
				else
					x++;
			}
		}
	}
}

class RadioBehavior extends AccessoryBehavior {
	onDraw(port) {
		const levels = this.highlighted ? PAPER_LEVELS : INK_LEVELS;
		drawTable(port, levels, RING, 0, 0);
		if (this.on)
			drawTable(port, levels, DOT, RADIUS - 3, RADIUS - 3);
	}
}

class RowBehavior extends Behavior {
	onCreate(row, $) {
		this.$ = $;
	}
	onReload(row, highlighted) {
		const port = row.last.last;
		port.behavior.highlighted = highlighted;
		port.behavior.on = this.$.menu.isOn(this.$.index);
		port.invalidate();
	}
}

const boxSkin = new Skin({ fill: GColor.Clear, stroke: [GColor.Black, GColor.White], borders: { left: 1, right: 1, top: 1, bottom: 1 } });

const CheckboxRow = Container.template($ => ({
	left: 0, right: 0, Behavior: RowBehavior,
	contents: [
		MenuTitle($),
		Container($, {
			right: 2 * BOX - 16, width: 16, height: BOX + 6, // 18 tall and centred: the box at h/2 - 6, the tick 3 px above
			contents: [
				Content($, { left: 0, top: 3, width: BOX, height: BOX, skin: boxSkin }),
				Port($, { left: 0, top: 0, width: 16, height: 16, Behavior: TickBehavior }),
			],
		}),
	],
}));

const RadioRow = Container.template($ => ({
	left: 0, right: 0, Behavior: RowBehavior,
	contents: [
		MenuTitle($),
		Container($, {
			right: 4 * RADIUS - DIAMETER, width: DIAMETER, height: DIAMETER + 1, // the circle centred at (width - 3 * radius, height / 2)
			contents: [
				Port($, { left: 0, top: 1, width: DIAMETER, height: DIAMETER, Behavior: RadioBehavior }),
			],
		}),
	],
}));

function listData(data, Row) {
	const items = data.items.map(item => typeof item === "string" ? { title: item } : item);
	const count = items.length;
	if (data.submit !== null)
		items.push({ title: data.submit ?? "Submit", submit: true });
	return {
		...data, items,
		Item: function($, it) { return $.index < count ? Row($, it) : MenuItem($, it); }, // a function, not an arrow: Menu calls it with new
		onSelect: undefined,
	};
}

class CheckboxBehavior extends Menu.Behavior {
	onSelect(menu, index, item) {
		const view = this.view;
		if (item.submit) {
			if (view.data.onSubmit)
				view.data.onSubmit(view.checked);
		}
		else {
			view.checked[index] = !view.checked[index];
			if (view.data.onChange)
				view.data.onChange(index, view.checked[index]);
			this.reload(menu);
		}
		return true;
	}
}

export class CheckboxList extends Menu {
	static get Behavior() { return CheckboxBehavior }
	constructor(data) {
		super(listData(data, CheckboxRow));
		this.checked = data.checked ? data.checked.slice() : new Array(data.items.length).fill(false);
	}
	isOn(index) {
		return this.checked[index];
	}
}

class RadioBehaviorList extends Menu.Behavior {
	onSelect(menu, index, item) {
		const view = this.view;
		if (item.submit) {
			if (view.data.onSubmit)
				view.data.onSubmit(view.choice);
		}
		else {
			view.choice = index;
			if (view.data.onChange)
				view.data.onChange(index);
			this.reload(menu);
		}
		return true;
	}
}

export class RadioList extends Menu {
	static get Behavior() { return RadioBehaviorList }
	constructor(data) {
		super(listData(data, RadioRow));
		this.choice = data.choice ?? 0;
	}
	isOn(index) {
		return this.choice === index;
	}
}
