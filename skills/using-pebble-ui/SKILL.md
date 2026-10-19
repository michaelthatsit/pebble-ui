---
name: using-pebble-ui
description: Use when building or changing a Pebble Alloy watchapp's screens with the pebble-ui library (menus, action menus, dialogs, status bar, PIN entry, dashboards, cards), when scaffolding a new Alloy project on it, or when an Alloy app aborts in the emulator with "memory full", "fxMapArchive failed", "Slot allocation", "Chunk allocation" or "stack overflow".
---

# Using pebble-ui

Pebble's native widgets for Alloy (JavaScript on the watch, Piu UI), each
measured pixel for pixel against the C SDK: `~/workspace/pebble-ui`
(github.com/michaelthatsit/pebble-ui). Emery and gabbro only. The README
lists every module's data and the module headers document their options;
read those, this skill is the workflow around them.

## Scaffold

```sh
pebble new-project --alloy myapp && cd myapp     # creates myapp; it refuses a directory that exists
git init && git submodule add https://github.com/michaelthatsit/pebble-ui.git pebble-ui
```

Then, in `package.json`, set `"watchface": false`, keep a `messageKeys` entry
and `src/pkjs/index.js` (the wscript bundles it), and list icons as
`{ "type": "bitmap", "name": "WARNING", "file": "images/warning.png" }` under
`resources.media`, the files under `resources/`. Replace three files with the
versions from `pebble-ui/examples/fitsky-patterns/src/`:

- `c/mdbl.c`: the machine sizes (`stack 5120, slot 45056, chunk 21504`). The
  template's default 32 kB machine aborts with `memory full` at launch.
- `embeddedjs/manifest.json`: map the modules you use. Paths are relative to
  `src/embeddedjs`, so a submodule at the project root is
  `"pebble-ui/Menu": "../../pebble-ui/modules/Menu"` and a sibling checkout
  `../../../pebble-ui/...`. Mirror the machine sizes in `config.creation`,
  and keep only the `manifest_mod.json` include (the template's typings
  include adds nothing to the build). Including the library's whole
  `manifest.json` compiles every module in and overruns the emulator.
- `embeddedjs/main.js`: the Application with `behavior: new WindowStack`,
  Piu lists 1024, home window by module name.

## Windows

| Screen | Module |
| --- | --- |
| a list of rows, two-line rows, full-screen colour cards | `Menu`, `subtitles`, `cards` |
| rows with checkboxes or radio buttons and a Submit row | `lists` |
| the firmware's action menu (Start / Cancel) | `ActionMenu` |
| a message that slides up, a question with an action bar, "set up in the phone app" | `dialogs` |
| big numbers: a clock or value in the middle, four corner values, optional title | `StatsScreen` |
| number fields to adjust with Up and Down | `AdjustWindow`, `SelectionLayer` |
| PIN entry | `PinWindow` |
| centred text lines with a status line | `InfoScreen` |
| a titled list of bars, optionally under the status bar (`statusBar: true`) | `BarList`, `ProgressLayer` |
| the time at the top of your own window | `StatusBar` |

Open windows by module name so each loads on first use:
`WindowStack.current.push("pebble-ui/ActionMenu", data)`. That works for
default exports (`Menu`, `ActionMenu`, `StatsScreen`, `PinWindow`,
`AdjustWindow`, `InfoScreen`, `BarList`, `cards`, `subtitles`). For the named
exports use `importNow("pebble-ui/dialogs").MessageDialog` and
`importNow("pebble-ui/lists").CheckboxList` inside the handler, not a static
import at the top of the file.

Dependencies to map alongside: everything needs `sdk`, `View`, `WindowStack`;
`dialogs` needs `ActionBar`; `PinWindow` needs `SelectionLayer` and
`StatusBar`; `AdjustWindow` needs `SelectionLayer`; `BarList` needs
`ProgressLayer` and `StatusBar`; `lists`, `cards` and `subtitles` need
`Menu`; `LongPress` needs `View`. A module cannot be imported from inside a
Piu template (`importNow` there throws `No contents!`): import it at the top
of the file, or look it up in a button handler.

A window of your own is a `View` subclass: its `Template` builds the screen,
its `Behavior` gets `onPressUp/Down/Select/Back` and the `onRelease...`
events (return true to consume one), `onDisplayed` and `onUndisplaying` for
timers. Back pops unless you consume it. Lay text out with
`textLayerStyle(font, color, align)` at the C frame's top: Piu draws Pebble
fonts a few pixels higher and the style corrects it. Icons are
`bitmapSkin(id)` with `id` the 1-based position in `resources.media`, made per
window, never at module scope. Give `ActionMenu` a `background` colour (the
rail), and `StatsScreen` a `background` when the text should be white.
`sdk`'s `GColor` has only the colours the SDK's own UI uses (Black, White,
the greys, Red, DarkCandyAppleRed, Yellow, JaegerGreen, BlueMoon):
`GColor.Blue`, `GColor.Orange`, `GColor.Purple` are undefined there, and a
window given an undefined option throws `pebble-ui: background is
undefined` at launch. For other colours map `pebble-ui/colors` (2 kB) or
write the hex (`"#0000FF"`). Data shapes that trip people up:
`CheckboxList` takes `items` as strings and calls `onSubmit(checked)` with
booleans; `Menu.onSelect(index, item)` gets your item object back; `PinWindow`
calls `onComplete(digits)` with numbers once Select leaves the last cell, and
Back on the first cell pops.

## Memory, when the emulator aborts

| Message | Cause | Fix |
| --- | --- | --- |
| `memory full` at launch | template machine sizes | the `mdbl.c` above |
| `fxMapArchive failed` | compiled code too large for the app heap, about 42 kB with these sizes (`build/mods/emery/mc.xsa`) | map fewer modules; split screens into another app |
| `Slot allocation: failed` | too much resident code or too many objects | open windows by module name; fewer, larger modules |
| `Chunk allocation: ... failed` | too many Piu contents or Texts on screen | fewer contents per row, Label instead of Text |
| `stack overflow` | stack below 5120 | keep 5120 |

Each imported module stays resident for the app's life. On the watch the
code is in flash and 40 kB roomier than the emulator.

## Verify on the emulator

`pebble-ui/tools/` has the loop as scripts; run them with their interpreter:

```sh
pebble build
bash pebble-ui/tools/tour.sh . emery shots steps.txt   # installs, runs the steps, logs to shots/log.txt
python3 pebble-ui/tools/describe.py shots/home.png     # the screen in numbers: background, text bands
python3 pebble-ui/tools/sheet.py all.png shots/*.png   # one labelled image of every frame
python3 pebble-ui/tools/diff.py mine.png theirs.png    # pixels differing, and their rows
```

A steps file is one step per line: `shot home`, `click down`, `click select
3` (the wait in seconds), `wait 2`. By hand instead: `pebble install
--emulator emery`, `pebble emu-button --emulator emery click <back|up|select|down>`,
`pebble screenshot --no-open --emulator emery shot.png`, `pebble kill`.
`emu-button` and `kill` print nothing on success. `pebble install --logs`
and `pebble logs` block, so run them in the background with a timeout
longer than the session; `pebble kill` ends them with a WebSocket traceback
that is not an app error. Screenshot animated screens (the message dialog,
action menus) 3 s after opening: the first open also loads the module, and
the emulator commands are slow. `QemuInboundPacket` warnings in the log are
noise. Check a screen you cannot look at with `describe.py`: text comes out
as bands of rows at the columns it occupies, so a Label at `top: 44` in
Gothic 18 Bold shows as a band starting at row 51. When recreating a C
screen, build the C app for the same emulator, tour it the same way and
`diff.py` the frames; zero pixels differing is the bar the library meets.

On the watch: in the phone app's watch settings turn on the LAN developer
connection, note the IP it shows, then `pebble install --phone <ip>` and
`pebble logs --phone <ip>`.

## Common mistakes

- Static imports of every library module in the home window: slots run out
  on the tenth screen.
- Reading the manifest paths as relative to the project root.
- Calling a template through a property (`$.Item(...)`): it takes `$` as
  `this`. Use `new $.Item(...)`.
- `Port.onDraw(port, x, y, w, h)` receives the dirty area; the port's size is
  `port.width` and `port.height`. `Port.drawString` ignores the style's
  alignment and margins.
