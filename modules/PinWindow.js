// A PIN entry window: a title, a SelectionLayer of digits centred on the
// screen, a line under it, and the status bar.
//
//   stack.push(PinWindow, { onComplete(digits) {...} })
//   data: onComplete(digits), numCells (3), maxValue (9),
//   title ("PIN Required"), subtitle ("Enter your PIN to continue"),
//   highlightColor (Red), inactiveColor (DarkGray)
import { GColor, FONT_KEY, textLayerStyle } from "pebble-ui/sdk";
import { SelectionLayer } from "pebble-ui/SelectionLayer";
import { StatusBar } from "pebble-ui/StatusBar";
import View from "pebble-ui/View";

const CELL_WIDTH = 40;
const CELL_HEIGHT = 34;
const CELL_PADDING = 4;
// The texts keep their distances to the cells from the original 168 px layout.
const TITLE_ABOVE = 37;
const SUBTITLE_BELOW = 14;

const textStyle = textLayerStyle(FONT_KEY.GOTHIC_18_BOLD, GColor.Black, "center");

class PinWindowBehavior extends View.Behavior {
	// The selection layer takes the buttons.
	onDisplayed(container) {
		container.content(2).focus();
	}
}

const PinWindowContainer = Container.template($ => {
	const width = $.numCells * CELL_WIDTH + ($.numCells - 1) * CELL_PADDING;
	const top = (screen.height - CELL_HEIGHT) >> 1;
	return {
		skin: new Skin({ fill: GColor.White }), Behavior: $.constructor.Behavior,
		contents: [
			Label($, { left: 0, right: 0, top: top - TITLE_ABOVE, bottom: 0, style: textStyle, string: $.title }),
			Text($, { left: 5, right: 5, top: top + CELL_HEIGHT + SUBTITLE_BELOW, bottom: 10, style: textStyle, string: $.subtitle }),
			SelectionLayer({
				numCells: $.numCells,
				cellWidths: new Array($.numCells).fill(CELL_WIDTH),
				cellPadding: CELL_PADDING,
				activeBackgroundColor: $.highlightColor,
				inactiveBackgroundColor: $.inactiveColor,
				callbacks: $.callbacks(),
			}, { left: (screen.width - width) >> 1, top, width, height: CELL_HEIGHT }),
			StatusBar({ color: GColor.Black }),
		],
	};
});

export default class PinWindow extends View {
	static get Behavior() { return PinWindowBehavior }
	constructor(data) {
		super(data);
		this.numCells = data.numCells ?? 3;
		this.maxValue = data.maxValue ?? 9;
		this.title = data.title ?? "PIN Required";
		this.subtitle = data.subtitle ?? "Enter your PIN to continue";
		this.highlightColor = data.highlightColor ?? GColor.Red;
		this.inactiveColor = data.inactiveColor ?? GColor.DarkGray;
		this.digits = new Array(this.numCells).fill(0);
	}
	callbacks() {
		const digits = this.digits, maxValue = this.maxValue;
		return {
			getCellText: (index) => String(digits[index]),
			complete: () => { if (this.data.onComplete) this.data.onComplete(digits.slice(), this); },
			increment: (index) => { digits[index] = digits[index] >= maxValue ? 0 : digits[index] + 1; },
			decrement: (index) => { digits[index] = digits[index] <= 0 ? maxValue : digits[index] - 1; },
		};
	}
	get Template() { return PinWindowContainer }
}
