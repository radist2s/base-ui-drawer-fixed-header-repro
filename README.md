# Base UI Drawer: fixed header gestures

The same address picker with and without a local Yarn patch. The handle, Back,
title and Add button all belong to **one fixed header inside `Drawer.Content`**.

- [Before — reproduction](https://stackblitz.com/github/radist2s/base-ui-drawer-fixed-header-repro/tree/reproduction)
- [After — patched](https://stackblitz.com/github/radist2s/base-ui-drawer-fixed-header-repro/tree/fixed)

The app code is identical in both branches. Only the dependency resolution,
lockfile and patch differ. The page deliberately does not simulate a broken or
fixed gesture: all swipes are handled by Base UI.

## Try it

Open the preview in a separate tab from StackBlitz. In Chrome DevTools, enable a
mobile profile with touch (for example iPhone 12 Pro), then reload. A narrow
viewport alone does not enable touch input.

1. Start with the long list and the compact Drawer.
2. Swipe upward on the handle or title. The unpatched Drawer stays compact;
   with the patch, the gesture should expand it.
3. Return to Compact with Back and the Compact button. Click **Toggle list
   scroll**, then **Expanded**. Swipe downward on the header while the list
   is scrolled. With the patch, this should collapse the Drawer without first
   returning the list to the top. A further downward swipe should close it.
4. Swipe on the address list itself: it should scroll normally.
5. Click Add: one example address is appended. Back and Use this address close
   the Drawer. A drag starting on Add must not trigger its click.
6. Try **Short list (1)**. This is the no-overflow control case; it is not
   expected to reproduce every long-list failure.

The status reports the current snap state, scroll position and number of added
addresses. The expandable log reports real Base UI change callbacks.

For directly opening control states, append `?list=short` or `?snap=expanded`
to the **preview app** URL. Both parameters can be combined.

## Layout

- Two snap points: 50% and 88% of viewport height.
- A single fixed header, including its handle, inside the scroll container.
- A named scroll timeline reveals the tinted glass background, blur and shadow.
- `scrollbar-gutter: stable` on the list and a non-overflowing header wrapper
  reserves the same native scrollbar width without a hardcoded compensation.
- The scroll area's visible height follows Base UI's snap/swipe CSS variables;
  the bottom action remains at the bottom of the visible Drawer.
- The header has `touch-action: none` in **both** branches. That CSS rule alone
  does not change Base UI's search for scrollable ancestors.

## Patch boundary

Both branches use the Base UI PR #5571 preview, matching the application build
for which the supplied patch was written:

```text
https://pkg.pr.new/mui/base-ui/@base-ui/react@5571
https://pkg.pr.new/mui/base-ui/@base-ui/utils@5571
```

The `fixed` branch applies `.yarn/patches/fixed-header.patch`. It stops the
Drawer's search for scrollable ancestors at `position: fixed`, after checking
whether that element itself can scroll. This demonstrates the supplied fix;
it does not claim that this heuristic is a finalized public API or that the
reproduction has been verified against every newer Base UI release.

## Run locally / StackBlitz

Requires a current Node.js version compatible with Vite 8 (Node 22.12+ or 24).

```sh
node .yarn/releases/yarn-4.6.0.cjs install --immutable
node .yarn/releases/yarn-4.6.0.cjs dev
node .yarn/releases/yarn-4.6.0.cjs build
```

StackBlitz uses the startup configuration from
[the previous canceled-swipe reproduction](https://github.com/radist2s/base-ui-drawer-canceled-swipe-repro).
Its automatic dependency installer is disabled because it can invoke Yarn 1,
which does not support this `patch:` setup. The startup script invokes the
committed Yarn 4.6.0 release directly, then starts Vite after successful linking.
