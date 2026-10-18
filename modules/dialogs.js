// The SDK's dialog patterns as windows (pebble-ui/View), with the layouts of
// pebble-examples/ui-patterns, anchored for these displays. Icons are resource
// IDs (package.json resources.media).
//
//   stack.push(MessageDialog, { icon: RESOURCE_ID.WARNING, text: "Battery is low! Connect the charger." })
//   stack.push(ChoiceDialog, { icon: RESOURCE_ID.CONFIRM, text: "Set as default?",
//                              up: RESOURCE_ID.TICK, down: RESOURCE_ID.CROSS, onUp() {...}, onDown() {...} })
//   stack.push(ConfigDialog, { icon: RESOURCE_ID.CONFIG_REQUIRED, title: "Example App", body: "Set up in the\nPebble app" })
import { PBL_IF_COLOR_ELSE, PBL_IF_ROUND_ELSE, ACTION_BAR_WIDTH, GColor, FONT_KEY, bitmapSkin, textLayerStyle } from "pebble-ui/sdk";
import { ActionBar } from "pebble-ui/ActionBar";
import Timeline from "piu/Timeline";
import View from "pebble-ui/View";

// Message dialog: a coloured sheet with an icon and a message that slide up
// from the bottom 700 ms after the window appears (250 ms, ease in-out).
// data: icon, text, background (Yellow / White), color (Black), margin (10)

const APPEAR_DELAY_MS = 700;
const APPEAR_DURATION_MS = 250;

class MessageDialogBehavior extends View.Behavior {
	onDisplaying(container) {
		const view = this.view, margin = view.margin, y = container.y;
		const background = container.first, icon = background.next, label = icon.next;
		const timeline = this.timeline = new Timeline();
		timeline.to(background, { y }, APPEAR_DURATION_MS, Math.quadEaseInOut, APPEAR_DELAY_MS);
		timeline.to(icon, { y: y + margin }, APPEAR_DURATION_MS, Math.quadEaseInOut, APPEAR_DELAY_MS);
		timeline.to(label, { y: y + margin + view.iconSkin.height + 5 }, APPEAR_DURATION_MS, Math.quadEaseInOut, APPEAR_DELAY_MS);
		container.duration = timeline.duration;
		timeline.seekTo(0);
		container.time = 0;
		container.start();
	}
	onTimeChanged(container) {
		this.timeline.seekTo(container.time);
	}
	onUndisplaying(container) {
		container.stop();
		super.onUndisplaying(container);
	}
}

const MessageDialogContainer = Container.template($ => ({
	skin: new Skin({ fill: GColor.Black }), Behavior: $.constructor.Behavior,
	contents: [
		Content($, { left: 0, right: 0, top: screen.height, height: screen.height, skin: new Skin({ fill: $.background }) }),
		Content($, { left: PBL_IF_ROUND_ELSE((screen.width - $.iconSkin.width) >> 1, $.margin), top: screen.height + $.margin, skin: $.iconSkin }),
		Text($, {
			left: $.margin, width: screen.width - 2 * $.margin, top: screen.height + $.margin + $.iconSkin.height, height: screen.height,
			style: textLayerStyle(FONT_KEY.GOTHIC_24_BOLD, $.color, PBL_IF_ROUND_ELSE("center", "left")), string: $.text,
		}),
	],
}));

export class MessageDialog extends View {
	static get Behavior() { return MessageDialogBehavior }
	constructor(data) {
		super(data);
		this.iconSkin = bitmapSkin(data.icon);
		this.text = data.text;
		this.background = data.background ?? PBL_IF_COLOR_ELSE(GColor.Yellow, GColor.White);
		this.color = data.color ?? GColor.Black;
		this.margin = data.margin ?? 10;
	}
	get Template() { return MessageDialogContainer }
}

// Choice dialog: an icon over a question, with an action bar. The label takes
// the bottom LABEL_HEIGHT px and the icon is centred in the rest.
// data: icon, text, background (JaegerGreen / White), color (Black), up, select,
// down (resource IDs), onUp(), onSelect(), onDown()

const LABEL_HEIGHT = 56;

class ChoiceDialogBehavior extends View.Behavior {
	onPressUp(container) {
		return this.answer("onUp");
	}
	onPressSelect(container) {
		return this.answer("onSelect");
	}
	onPressDown(container) {
		return this.answer("onDown");
	}
	answer(name) {
		const handler = this.view.data[name];
		if (handler)
			handler(this.view);
		return true;
	}
}

const ChoiceDialogContainer = Container.template($ => ({
	skin: new Skin({ fill: $.background }), Behavior: $.constructor.Behavior,
	contents: [
		// a BitmapLayer centres its bitmap, rounding down
		Container($, { left: 14, top: 7, right: 28, bottom: LABEL_HEIGHT, contents: [
			Content($, { top: (screen.height - 7 - LABEL_HEIGHT - $.iconSkin.height) >> 1, skin: $.iconSkin }),
		] }),
		Label($, {
			left: ACTION_BAR_WIDTH >> 1, right: ACTION_BAR_WIDTH, top: screen.height - LABEL_HEIGHT, bottom: 0,
			style: textLayerStyle(FONT_KEY.GOTHIC_24_BOLD, $.color, "center"), string: $.text,
		}),
		ActionBar({ background: $.background, up: $.upSkin, select: $.selectSkin, down: $.downSkin }),
	],
}));

export class ChoiceDialog extends View {
	static get Behavior() { return ChoiceDialogBehavior }
	constructor(data) {
		super(data);
		this.iconSkin = bitmapSkin(data.icon);
		this.text = data.text;
		this.background = data.background ?? PBL_IF_COLOR_ELSE(GColor.JaegerGreen, GColor.White);
		this.color = data.color ?? GColor.Black;
		this.upSkin = data.up ? bitmapSkin(data.up) : null;
		this.selectSkin = data.select ? bitmapSkin(data.select) : null;
		this.downSkin = data.down ? bitmapSkin(data.down) : null;
	}
	get Template() { return ChoiceDialogContainer }
}

// Config dialog ("set up in the phone app"): a title at the top, the icon
// centred, the body 2 px under it.
// data: icon, title, body, background (DarkGray / White), color (White / Black)

const BODY_GAP = 2;

const ConfigDialogContainer = Container.template($ => ({
	skin: new Skin({ fill: $.background }), Behavior: $.constructor.Behavior,
	contents: [
		Content($, { top: (screen.height - $.iconSkin.height) >> 1, skin: $.iconSkin }),
		Label($, { left: 0, right: 0, top: 10, bottom: 0, style: textLayerStyle(FONT_KEY.GOTHIC_24_BOLD, $.color, "center"), string: $.title }),
		Text($, {
			left: 5, right: 5, top: ((screen.height - $.iconSkin.height) >> 1) + $.iconSkin.height + BODY_GAP, bottom: 0,
			style: textLayerStyle(FONT_KEY.GOTHIC_18_BOLD, $.color, "center"), string: $.body,
		}),
	],
}));

export class ConfigDialog extends View {
	constructor(data) {
		super(data);
		this.iconSkin = bitmapSkin(data.icon);
		this.title = data.title;
		this.body = data.body;
		this.background = data.background ?? PBL_IF_COLOR_ELSE(GColor.DarkGray, GColor.White);
		this.color = data.color ?? PBL_IF_COLOR_ELSE(GColor.White, GColor.Black);
	}
	get Template() { return ConfigDialogContainer }
}
