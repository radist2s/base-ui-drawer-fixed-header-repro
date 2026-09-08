# Base UI Drawer: explicit drag area proof of concept

[Open this PoC in StackBlitz](https://stackblitz.com/github/radist2s/base-ui-drawer-fixed-header-repro/tree/drag-area-poc).
Drag the handle, title or empty header space **with your mouse**, without enabling
mobile emulation. Touch dragging works too. Back and Add retain their normal
button behavior; mouse dragging does not start on those buttons.

This branch demonstrates a proposed interaction contract, not an existing public
Base UI API. It uses a small Yarn patch and the same address-picker layout as the
original reproduction.

```jsx
<Drawer.Content>
  <header data-base-ui-drag-area="">{/* Handle, title, Back and Add */}</header>
  <AddressList />
</Drawer.Content>
```

## Proposed contract

- The marked header explicitly opts into mouse and touch dragging inside
  `Drawer.Content`, regardless of the outer list's scroll position.
- A scrollable descendant inside the marked area keeps its own scrolling behavior.
- `data-base-ui-swipe-ignore` takes priority over the drag-area opt-in.
- Unmarked content retains the existing behavior. Fixed positioning alone does
  not opt an element into dragging in this branch.
- Snap points, gesture physics, pointer capture and dismissal remain owned by
  the existing Base UI machinery. Mouse presses on controls in the marked area
  are rejected before a pending drag can start, using its existing control selector.

The attribute is a provisional way to demonstrate a possible future component.
This PoC does not settle the name, public API, or every composition involving
nested drawers, shadow roots, horizontal gestures, or text selection.

## Compare

- [Original reproduction](https://stackblitz.com/github/radist2s/base-ui-drawer-fixed-header-repro/tree/reproduction): no patch.
- [Fixed-position heuristic](https://stackblitz.com/github/radist2s/base-ui-drawer-fixed-header-repro/tree/fixed): the earlier touch fix.
- [Explicit drag area](https://stackblitz.com/github/radist2s/base-ui-drawer-fixed-header-repro/tree/drag-area-poc): this proposal, supporting mouse and touch.

The earlier branches are preserved unchanged. This branch replaces the fixed-position
heuristic rather than stacking a second behavior on top of it.

## Try it

1. With the long list, drag the handle or title upward to expand the Drawer.
2. Scroll the address list, then drag the header downward to collapse. The list
   keeps its scroll position. Drag downward again to close.
3. Click Compact to reopen. Try Back, Add, address selection, and Use this address.
4. Select Short list (1) to check the no-overflow case.
5. For touch comparison, open the preview in a separate tab, enable a Chrome
   DevTools mobile profile with touch, and reload.

The status and expandable event log report real Drawer state. The single fixed
header includes the handle, scroll-linked glass effect, and native scrollbar
compensation. The bottom action stays at the visible bottom edge.

## Patch scope

`.yarn/patches/drag-area.patch` changes three implementation modules (plus their
ESM/CommonJS copies and internal declarations):

- `DrawerViewport`: allow an explicitly marked area inside Content through the
  pointer-start guard; use the same boundary for touch-scroll arbitration.
- `scrollable`: stop ancestor searches at the attribute after checking the node
  itself for scrolling. No inference from `position: fixed`.
- `useSwipeDismiss`: enable that boundary in the existing Drawer gesture checks
  and keep a mouse press on a control from becoming a drag after leaving it.

Both packages remain pinned to the PR #5571 preview used by the original patch:
`https://pkg.pr.new/mui/base-ui/@base-ui/react@5571` and
`https://pkg.pr.new/mui/base-ui/@base-ui/utils@5571`.

## Local development and tests

Use a current Node.js release compatible with Vite 8 and an installed Google Chrome.

```sh
node .yarn/releases/yarn-4.6.0.cjs install --immutable
node .yarn/releases/yarn-4.6.0.cjs dev --port 63102
# In another terminal:
node .yarn/releases/yarn-4.6.0.cjs test
node .yarn/releases/yarn-4.6.0.cjs build
```

`DEMO_URL` overrides the test server URL. Tests cover native multi-step touch
swipes and desktop mouse dragging, including the explicit marker and exclusions.

StackBlitz uses the committed Yarn 4.6.0 release and `scripts/stackblitz-start.cjs`.
Automatic dependency installation is disabled so Yarn 1 cannot bypass the
repository's `patch:` setup. No test browser is installed inside StackBlitz.
