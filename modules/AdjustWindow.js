// A window of number fields in SelectionLayers, after fitsky's adjust window:
// a title, rows of cells with small-caps labels (above the first row, under
// the others), the group centred. Select moves from one row to the next and
// completes on the last; Back moves up a row, and pops from the first.
//
//   WindowStack.current.push(AdjustWindow, {
//     title: "Bench Press",
//     rows: [
//       [{ label: "SETS", text: () => String(sets), increment() { sets++ }, decrement() { if (sets) sets-- } },
//        { label: "REPS", ... }],
//       [{ label: "WEIGHT", ... }],
//     ],
//     onComplete() {...}, background: GColor.Purple })
//
// Cells are 52 px wide and 34 tall, 8 apart; a row with one field spans the
// widest row. Active cells are white with black digits, the others dark grey
// with white digits (fitsky's SelectionLayer colours).
import { PBL_IF_COLOR_ELSE, GColor, FONT_KEY, textLayerStyle } from "pebble-ui/sdk";
import { SelectionLayer } from "pebble-ui/SelectionLayer";
import View from "pebble-ui/View";
import WindowStack from "pebble-ui/WindowStack";

const CELL_WIDTH = 52;
const CELL_PADDING = 8;
const CELL_HEIGHT = 34;
const LABEL_HEIGHT = 16;
const TITLE_HEIGHT = 24;
const ROW_GAP = 6;

class AdjustWindowBehavior extends View.Behavior {
	onDisplayed(container) {
		this.activate(container, 0);
	}
	layers(container) {
		return this.view.rows.map((row, i) => container.content("row" + i));
	}
	activate(container, index) {
		this.view.activeRow = index;
		this.layers(container).forEach((port, i) => port.behavior.setActive(port, i === index));
		container.content("row" + index).focus();
	}
	// A row's SelectionLayer completed: the next row, or done.
	onRowComplete(container, index) {
		if (index + 1 < this.view.rows.length)
			this.activate(container, index + 1);
		else if (this.view.data.onComplete)
			this.view.data.onComplete(this.view);
		else
			WindowStack.current.pop();
	}
	// Back on a row's first cell bubbles here: the row above, or pop.
	onPressBack(container) {
		const index = this.view.activeRow;
		if (index > 0) {
			this.activate(container, index - 1);
			return true;
		}
		return super.onPressBack(container);
	}
}

const AdjustWindowContainer = Container.template($ => {
	const color = $.color;
	const rows = $.rows;
	const width = Math.max(...rows.map(row => row.length * CELL_WIDTH + (row.length - 1) * CELL_PADDING));
	let groupHeight = TITLE_HEIGHT + 2 + LABEL_HEIGHT + CELL_HEIGHT;
	for (let i = 1; i < rows.length; i++)
		groupHeight += ROW_GAP + CELL_HEIGHT + LABEL_HEIGHT;
	const left = (screen.width - width) >> 1;
	let y = (screen.height - groupHeight) >> 1;
	const contents = [
		Label($, { left: 4, right: 4, top: y, height: TITLE_HEIGHT, style: textLayerStyle(FONT_KEY.GOTHIC_18_BOLD, color, "center"), string: $.title }),
	];
	y += TITLE_HEIGHT + 2;
	const labelStyle = textLayerStyle(FONT_KEY.GOTHIC_14, color, "center");
	rows.forEach((row, index) => {
		const cellWidth = row.length === 1 ? width : CELL_WIDTH;
		const labels = (top) => row.forEach((field, i) => contents.push(Label($, { left: left + i * (CELL_WIDTH + CELL_PADDING), width: cellWidth, top, height: LABEL_HEIGHT, style: labelStyle, string: field.label })));
		if (index === 0) {
			labels(y);
			y += LABEL_HEIGHT;
		}
		else
			y += ROW_GAP;
		const layer = SelectionLayer({
			numCells: row.length, cellWidths: row.map(() => cellWidth), cellPadding: row.length === 1 ? 0 : CELL_PADDING,
			activeBackgroundColor: GColor.White, inactiveBackgroundColor: PBL_IF_COLOR_ELSE(GColor.DarkGray, GColor.Black),
			textColor: GColor.White, activeTextColor: GColor.Black, active: index === 0,
			callbacks: {
				getCellText: (i) => row[i].text(),
				increment: (i) => row[i].increment(),
				decrement: (i) => row[i].decrement(),
				complete: () => contents[0].container.delegate("onRowComplete", index),
			},
		}, { left, top: y, width, height: CELL_HEIGHT });
		layer.name = "row" + index;
		contents.push(layer);
		y += CELL_HEIGHT;
		if (index > 0) {
			labels(y);
			y += LABEL_HEIGHT;
		}
	});
	return { skin: new Skin({ fill: $.background }), Behavior: $.constructor.Behavior, contents };
});

export default class AdjustWindow extends View {
	static get Behavior() { return AdjustWindowBehavior }
	constructor(data) {
		super(data);
		this.title = data.title ?? "";
		this.rows = data.rows;
		this.activeRow = 0;
		this.background = data.background ?? GColor.White;
		this.color = data.color ?? PBL_IF_COLOR_ELSE(data.background ? GColor.White : GColor.Black, GColor.Black);
	}
	get Template() { return AdjustWindowContainer }
}
