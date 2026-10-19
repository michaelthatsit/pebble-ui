# pebble-ui

Pebble's native UI, for Alloy apps. Piu is the engine Alloy gives you (layout,
labels, skins, behaviors, animation); this is the widget set the C SDK has and
Piu does not: menus, the status bar, the action bar, dialogs, a progress bar,
the selection layer and a PIN window, plus a window stack with the SDK's slide
transition. Emery (Pebble Time 2) and gabbro (Pebble Round 2).

Everything that makes it look native was measured against the C SDK on the
emulators, pixel by pixel, rather than guessed: cell heights and scrolling,
fonts and their vertical offsets, where the action bar puts its icons, how the
firmware anti-aliases a circle. The reference app is
[ui-patterns-alloy](https://github.com/michaelthatsit/ui-patterns-alloy), a
recreation of pebble-examples/ui-patterns on this library, kept identical to
the C original.

## Using it

Add the library to your project (a git submodule or a sibling checkout) and
include its manifest from `src/embeddedjs/manifest.json`:

```json
{
	"include": [
		"$(MODDABLE)/examples/manifest_mod.json",
		"../../pebble-ui/manifest.json"
	],
	"modules": { "*": ["./main", "./windows/*"] }
}
```

Every module in the manifest is compiled into the app whether imported or not,
and compiled code is memory on the watch (and more so in the emulator, which
copies it into the app heap). To take only what you use, map the modules
yourself instead of including the manifest:

```json
"modules": {
	"pebble-ui/sdk": "../../pebble-ui/modules/sdk",
	"pebble-ui/View": "../../pebble-ui/modules/View",
	"pebble-ui/WindowStack": "../../pebble-ui/modules/WindowStack",
	"pebble-ui/Menu": "../../pebble-ui/modules/Menu"
}
```

`sdk`, `View` and `WindowStack` are needed by all the widgets; the rest are
independent of each other (`lists` needs `Menu`, `dialogs` needs `ActionBar`,
`PinWindow` needs `SelectionLayer` and `StatusBar`).

A minimal app:

```js
// main.js
import WindowStack from "pebble-ui/WindowStack";
const App = Application.template($ => ({ behavior: new WindowStack }));
export default new App({ View: "home" }, { commandListLength: 2048, displayListLength: 2048, touchCount: 0, pixels: screen.width * 4 });

// home.js
import Menu from "pebble-ui/Menu";
import WindowStack from "pebble-ui/WindowStack";
import { MessageDialog } from "pebble-ui/dialogs";
export default class Home extends Menu {
	constructor() {
		super({
			items: ["Say hello", "Settings"],
			onSelect(index) {
				if (index === 0)
					WindowStack.current.push(MessageDialog, { icon: 1, text: "Hello from pebble-ui" });
			},
		});
	}
}
```

The JavaScript machine's default 32 kB is too small for Piu apps of any size;
see the reference app's `src/c/mdbl.c` for working heap sizes, and its README
for how the emulator's 122 kB app heap is shared between the compiled code and
the machine's heaps (on the watch the code is read from flash instead).

## Modules

| Module | What | Construct |
| --- | --- | --- |
| `pebble-ui/sdk` | `ACTION_BAR_WIDTH`, `STATUS_BAR_LAYER_HEIGHT`, menu cell heights, `GColor` (the colours the SDK's UI uses; `pebble-ui/colors`, opt-in, has all 64), `FONT_KEY`, `PBL_IF_COLOR_ELSE`, `PBL_IF_ROUND_ELSE`, `textLayerStyle()`, `bitmapSkin()`, `solidSkin()` | import what you need |
| `pebble-ui/WindowStack` | the window stack, as the Application's behavior; `push(View, data)`, `pop(count)`, `depth`, `WindowStack.current` | `new WindowStack` |
| `pebble-ui/View` | a window: `Template` builds it, `Behavior` gets the buttons (`onPressUp/Down/Select/Back`, `onRelease...`); Back pops | subclass |
| `pebble-ui/Menu` | MenuLayer: `items`, `onSelect(index, item)`, `cellHeight`, `normal` and `highlight` colours, custom `Item` rows; a window, or embedded with `new menu.Template(menu, {...})` | `new Menu({...})` |
| `pebble-ui/lists` | `CheckboxList` (`checked`, `onChange`, `onSubmit(checked)`) and `RadioList` (`choice`, `onChange`, `onSubmit(choice)`), with the SDK's box, tick and circles | `new CheckboxList({...})` |
| `pebble-ui/StatusBar` | StatusBarLayer: the time, `color`, `dotted` separator; `clockString()` | `StatusBar({ color })` |
| `pebble-ui/ActionBar` | ActionBarLayer: `up`, `select`, `down` skins, `background` (the window's colour, for the round arc), `color` | `ActionBar({...})`, last in the window |
| `pebble-ui/ProgressLayer` | a rounded track and fill; `delegate("setProgress", n)` | `ProgressLayer({ width, ... }, { left, top, width, height })` |
| `pebble-ui/SelectionLayer` | the SDK's selection layer: cells, bump and slide animations, `callbacks` | `SelectionLayer({...}, frame)` |
| `pebble-ui/dialogs` | `MessageDialog` (sheet slides up), `ChoiceDialog` (icon, question, action bar, `onUp/onSelect/onDown`), `ConfigDialog` (title, icon, body) | `push(ChoiceDialog, {...})` |
| `pebble-ui/PinWindow` | digits in a SelectionLayer under a title, with the status bar; `onComplete(digits)` | `push(PinWindow, {...})` |

Each module's header comment documents its data and defaults.

## Conventions

- Positions are in the SDK's terms. `textLayerStyle(font, color, align)` makes
  a Label or Text start its text where a TextLayer with that frame top would
  (Piu draws Pebble fonts a few pixels higher; `TEXT_TOP_INSET` has the
  measured corrections).
- A highlighted menu row and everything in it have `state` 1, so skins and
  styles with `[normal, highlighted]` colours switch by themselves.
- Icons are `bitmapSkin(resourceId)` skins from the app's `resources.media`;
  make them per window instance (the bitmap lives in the app heap while the
  skin does).
- Nothing here is drawn from image resources of its own: the tick and the
  radio circles are coverage tables sampled from the firmware's output.

## Measured, not assumed

The numbers in `sdk.js`, `Menu.js`, `StatusBar.js` and `ActionBar.js` come
from screenshots of the C SDK on the emery and gabbro emulators, compared pixel
by pixel with this library's output. Anything added should go through the same
comparison; the reference app has the tooling.
