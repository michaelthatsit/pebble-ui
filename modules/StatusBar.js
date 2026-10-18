// A StatusBarLayer: the time, centred in a 20 px bar (Gothic 18 on these
// displays, measured), transparent over the window.
//
//   StatusBar({ color: GColor.Black, dotted: true })
//
// dotted: StatusBarLayerSeparatorModeDotted, every other pixel of the row two
// above the bar's bottom edge (measured at y 18). The clock updates on the
// onMinuteChanged that pebble-ui/WindowStack distributes.
import { STATUS_BAR_LAYER_HEIGHT as HEIGHT, STATUS_BAR_FONT, textLayerStyle } from "pebble-ui/sdk";

const TEXT_TOP = -2; // measured: the digits start at y 5

export function clockString(date = new Date()) {
	let hours = date.getHours();
	const minutes = date.getMinutes();
	if (watch.hour12)
		hours = (hours % 12) || 12;
	else if (hours < 10)
		hours = "0" + hours;
	return hours + ":" + (minutes < 10 ? "0" : "") + minutes;
}

class StatusBarBehavior extends Behavior {
	onMinuteChanged(bar) {
		bar.first.string = clockString();
	}
}

class DottedSeparatorBehavior extends Behavior {
	onCreate(port, $) {
		this.color = $.color;
	}
	onDraw(port) {
		for (let i = 0, width = port.width; i < width; i += 2)
			port.fillColor(this.color, i, 0, 1, 1);
	}
}

export const StatusBar = Container.template($ => ({
	left: 0, right: 0, top: 0, height: HEIGHT, Behavior: StatusBarBehavior,
	contents: [
		Label($, {
			left: 0, right: 0, top: TEXT_TOP, height: HEIGHT,
			style: textLayerStyle(STATUS_BAR_FONT, $.color, "center"),
			string: clockString(),
		}),
		$.dotted ? Port($, { left: 0, right: 0, top: HEIGHT - 2, height: 1, Behavior: DottedSeparatorBehavior }) : null,
	],
}));

export default StatusBar;
