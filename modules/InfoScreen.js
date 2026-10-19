// Lines of centred text on a full-bleed colour, with an optional status line
// at the bottom: fitsky's exercise, summary and confirm screens are all this.
//
//   new InfoScreen({ background: GColor.IslamicGreen, lines: [
//       { text: "Workout Complete", font: FONT_KEY.GOTHIC_24_BOLD, top: 12, height: 28 },
//       { text: "Running  0:10", font: FONT_KEY.GOTHIC_18_BOLD, top: 44, height: 24 },
//       { text: "0.0 km  0 steps\nHR avg 0", font: FONT_KEY.GOTHIC_18, top: 72, height: 48 },
//     ], status: "Posting..." })
//   screen.delegate("setLine", 2, "..."); screen.delegate("setStatus", "Posted!")
//
// Each line: text, font, top, height, left and right (8), align ("center"); a
// text with a newline or `wrap: true` gets a Text (which wraps). The status is
// Gothic 14, 28 px above the bottom, as fitsky has it.
import { PBL_IF_COLOR_ELSE, GColor, FONT_KEY, textLayerStyle } from "pebble-ui/sdk";
import View from "pebble-ui/View";

class InfoScreenBehavior extends View.Behavior {
	setLine(container, index, text) {
		container.content(index).string = text;
	}
	setStatus(container, text) {
		container.last.string = text;
	}
}

const InfoScreenContainer = Container.template($ => ({
	skin: new Skin({ fill: $.background }), Behavior: $.constructor.Behavior,
	contents: [
		...$.lines.map(line => {
			const Kind = line.wrap || line.text.indexOf("\n") >= 0 ? Text : Label;
			return Kind($, {
				left: line.left ?? 8, right: line.right ?? 8, top: line.top, height: line.height,
				style: textLayerStyle(line.font, line.color ?? $.color, line.align ?? "center"), string: line.text,
			});
		}),
		Label($, { left: 8, right: 8, top: screen.height - 28, height: 24, style: textLayerStyle(FONT_KEY.GOTHIC_14, $.color, "center"), string: $.status ?? "" }),
	],
}));

export default class InfoScreen extends View {
	static get Behavior() { return InfoScreenBehavior }
	constructor(data) {
		super(data);
		this.lines = data.lines;
		this.status = data.status;
		this.background = data.background ?? GColor.White;
		this.color = data.color ?? PBL_IF_COLOR_ELSE(data.background ? GColor.White : GColor.Black, GColor.Black);
	}
	get Template() { return InfoScreenContainer }
}
