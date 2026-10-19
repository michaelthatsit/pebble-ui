// A glanceable numbers screen, after fitsky's workout screens: a LECO clock
// in the middle with a line under it, an optional title above, and four
// numbers in the corners, on a full-bleed colour.
//
//   new StatsScreen({ center: "17:35", sub: "0:02", corners: ["--", "0:00", "--:--", "0.0"],
//                     title: "Freeform", background: GColor.Purple, color: GColor.White })
//   screen.delegate("update", { center, sub, corners, title, background })
//
// Without `center`, the middle shows the time of day and follows the minute.
// Layouts (fitsky's): without a title the clock sits at h/2 - 32 and the line
// (LECO 26 Bold) at h/2 + 18; with one, the title (Gothic 18 Bold) at
// h/2 - 52, the clock at h/2 - 30 and the line (LECO 20 Bold) at h/2 + 20.
// Corners are LECO 26 Bold, 8 px in and 6 px down or up.
import { PBL_IF_COLOR_ELSE, GColor, FONT_KEY, textLayerStyle, clockString } from "pebble-ui/sdk";
import View from "pebble-ui/View";

const CORNER_MARGIN_X = 8;
const CORNER_MARGIN_Y = 6;
const CORNER_HEIGHT = 28;

class StatsScreenBehavior extends View.Behavior {
	onDisplaying(container) {
		this.update(container, {});
	}
	onMinuteChanged(container) {
		if (this.view.center === undefined)
			container.content(1).string = clockString();
	}
	update(container, values) {
		const view = this.view;
		Object.assign(view, values);
		if (values.background)
			container.skin = new Skin({ fill: view.background });
		container.content(0).string = view.title ?? "";
		container.content(1).string = view.center ?? clockString();
		container.content(2).string = view.sub ?? "";
		for (let i = 0; i < 4; i++)
			container.content(3 + i).string = (view.corners && view.corners[i]) ?? "";
	}
}

const StatsScreenContainer = Container.template($ => {
	const h = screen.height, w = screen.width, color = $.color, titled = $.title !== undefined;
	const corner = (side, top) => Label($, {
		left: CORNER_MARGIN_X, right: CORNER_MARGIN_X, top, height: CORNER_HEIGHT,
		style: textLayerStyle(FONT_KEY.LECO_26_BOLD_NUMBERS_AM_PM, color, side),
	});
	return {
		skin: new Skin({ fill: $.background }), Behavior: $.constructor.Behavior,
		contents: [
			Label($, { left: 8, right: 8, top: (h >> 1) - 52, height: 24, style: textLayerStyle(FONT_KEY.GOTHIC_18_BOLD, color, "center"), visible: titled }),
			Label($, { left: 0, right: 0, top: (h >> 1) - (titled ? 30 : 32), height: 50, style: textLayerStyle(FONT_KEY.LECO_42_NUMBERS, color, "center") }),
			Label($, { left: 0, right: 0, top: (h >> 1) + (titled ? 20 : 18), height: titled ? 24 : 28, style: textLayerStyle(titled ? FONT_KEY.LECO_20_BOLD_NUMBERS : FONT_KEY.LECO_26_BOLD_NUMBERS_AM_PM, color, "center") }),
			corner("left", CORNER_MARGIN_Y),
			corner("right", CORNER_MARGIN_Y),
			corner("left", h - CORNER_HEIGHT - CORNER_MARGIN_Y),
			corner("right", h - CORNER_HEIGHT - CORNER_MARGIN_Y),
		],
	};
});

export default class StatsScreen extends View {
	static get Behavior() { return StatsScreenBehavior }
	constructor(data) {
		super(data);
		this.title = data.title;
		this.center = data.center;
		this.sub = data.sub;
		this.corners = data.corners;
		this.background = data.background ?? GColor.White;
		this.color = data.color ?? PBL_IF_COLOR_ELSE(data.background ? GColor.White : GColor.Black, GColor.Black);
	}
	get Template() { return StatsScreenContainer }
}
