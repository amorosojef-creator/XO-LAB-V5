# XO LAB 5 — device checklist

The automatic tests run on every build (Actions tab → **Test** jobs). They can't touch a real phone, PC or Mac, so tick these by hand after installing a new build.

## 5.1 new look (any device)
- [ ] Top bar: EDIT / PERFORM / OVERLAY switch layouts; the choice is remembered after reopening
- [ ] Telemetry cards move with the music (level gauge, band lines, BPM)
- [ ] FX CHAIN card: tapping a filter switches it on/off
- [ ] Strip: SAVE SCENE adds a card with a thumbnail; tapping a card loads it and shows LIVE
- [ ] FX PRESETS and 3D MOTION cards apply presets
- [ ] UI menu: changing the accent colour recolours live/active marks
- [ ] Callout labels show on the preview but are NOT in the exported video
- [ ] iPhone: preview stays at the top while scrolling the panels; pinch does not zoom

## Phase 1

### Mac (your MacBook)
- [ ] `.dmg` opens, drag to Applications works
- [ ] First open: warning → **Privacy & Security → Open Anyway** → app opens
- [ ] `.pkg` installs to Applications and opens
- [ ] Load a video + audio, press play: smooth preview, LEDs react
- [ ] Load a 3D model; liquid mercury works
- [ ] File ▸ Save Project → Save dialog → `.xolab` saved; File ▸ Open Project reopens it with media
- [ ] Edit ▸ Undo / Redo (Cmd+Z / Shift+Cmd+Z) change settings back and forth
- [ ] Export tab → RENDER & EXPORT → Save dialog → the video plays in QuickTime
- [ ] Note the export format shown (MP4 or MOV): ______
- [ ] Trackpad pinch does not zoom the interface
- [ ] View ▸ Toggle Full Screen works
- [ ] Quit and reopen: window comes back at the same size and position

### Windows PC
- [ ] Installer: **More info → Run anyway** → installs, desktop shortcut appears
- [ ] Portable `.exe` opens without installing
- [ ] Same checks as Mac: play, 3D, save/open project, Ctrl+Z / Ctrl+Y, render & export, fullscreen
- [ ] Note the export format shown (MP4 or MOV): ______

### iPhone
- [ ] IPA sideloads and opens
- [ ] Two-finger pinch does not resize the interface
- [ ] Save Project → share sheet → Save to Files works; Open Project from Files reopens it
- [ ] Undo / redo buttons in the top bar work
- [ ] Render & export → SAVE / SHARE → Save Video to Photos

### Browser (GitHub Pages or start.command / start.bat)
- [ ] Opens, plays, exports
- [ ] Save Project downloads a `.xolab` file; Open Project reopens it
