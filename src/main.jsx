import * as React from "react";
import { createRoot } from "react-dom/client";
import { Drawer } from "@base-ui/react/drawer";
import "./styles.css";

const SNAP_POINTS = [0.5, 0.88];
const names = [
  "Home",
  "Office",
  "Studio",
  "Workshop",
  "Apartment",
  "Gallery",
  "Reception",
  "Warehouse",
  "Guest house",
  "Store",
  "Atelier",
  "Other",
];
const streets = [
  "12 Maple Street",
  "48 Oak Avenue",
  "7 Garden Lane",
  "24 River Road",
];
const initialParams = new URLSearchParams(location.search);

function App() {
  const [open, setOpen] = React.useState(true);
  const [snapPoint, setSnapPoint] = React.useState(
    initialParams.get("snap") === "expanded" ? SNAP_POINTS[1] : SNAP_POINTS[0],
  );
  const [shortList, setShortList] = React.useState(
    initialParams.get("list") === "short",
  );
  const [selected, setSelected] = React.useState("Home");
  const [added, setAdded] = React.useState(0);
  const [scrollTop, setScrollTop] = React.useState(0);
  const [events, setEvents] = React.useState([]);
  const contentRef = React.useRef(null);
  const addresses = [
    ...names.slice(0, shortList ? 1 : 12),
    ...Array.from({ length: added }, (_, i) => `New address ${i + 1}`),
  ];

  function record(message) {
    setEvents((previous) => [message, ...previous].slice(0, 6));
  }

  function showAt(nextSnapPoint) {
    setSnapPoint(nextSnapPoint);
    setOpen(true);
  }

  return (
    <main className="page">
      <section className="instructions">
        <div className="eyebrow">Base UI · Explicit drag area · PoC</div>
        <h1>Drag the whole header</h1>
        <p>
          Drag the handle, title or empty header space with a mouse or touch.
          The list scrolls independently, and Back and Add remain ordinary
          buttons.
        </p>
        <div className="toolbar">
          <button onClick={() => showAt(SNAP_POINTS[0])}>Compact</button>
          <button onClick={() => showAt(SNAP_POINTS[1])}>Expanded</button>
          <label>
            Addresses{" "}
            <select
              value={shortList ? "short" : "long"}
              onChange={(event) => {
                setShortList(event.target.value === "short");
                setAdded(0);
                setSelected("Home");
                contentRef.current?.scrollTo({ top: 0 });
              }}
            >
              <option value="long">Long list (12)</option>
              <option value="short">Short list (1)</option>
            </select>
          </label>
          <button
            onClick={() =>
              contentRef.current?.scrollTo({
                top: scrollTop > 0 ? 0 : 150,
                behavior: "smooth",
              })
            }
          >
            Toggle list scroll
          </button>
        </div>
        <output className="status" data-testid="status">
          {open
            ? snapPoint === SNAP_POINTS[1]
              ? "Expanded"
              : "Compact"
            : "Closed"}{" "}
          · Scroll: {scrollTop}px · Added: {added}
        </output>
        <details>
          <summary>How to compare / event log</summary>
          <ol>
            <li>
              Try dragging with your mouse first. Mobile touch emulation also
              works.
            </li>
            <li>With the long list, swipe upward on the handle or title.</li>
            <li>
              Expand using the button, scroll the list, then swipe downward on
              the header.
            </li>
            <li>
              Compare the same gestures in the unpatched and patched branches.
            </li>
          </ol>
          <ul className="events">
            {events.map((event, index) => (
              <li key={index}>{event}</li>
            ))}
          </ul>
        </details>
      </section>
      <Drawer.Root
        open={open}
        modal={false}
        disablePointerDismissal
        snapPoints={SNAP_POINTS}
        snapPoint={snapPoint}
        snapToSequentialPoints
        onOpenChange={(nextOpen, details) => {
          setOpen(nextOpen);
          record(`open: ${nextOpen} (${details.reason})`);
        }}
        onSnapPointChange={(next, details) => {
          setSnapPoint(next);
          record(`snap: ${next} (${details.reason})`);
        }}
      >
        <Drawer.Portal>
          <Drawer.Backdrop className="backdrop" />
          <Drawer.Viewport className="viewport">
            <Drawer.Popup
              className="popup"
              initialFocus={false}
              finalFocus={false}
            >
              <Drawer.Content
                ref={contentRef}
                className="content"
                onScroll={(event) =>
                  setScrollTop(Math.round(event.currentTarget.scrollTop))
                }
              >
                <header className="header" data-base-ui-drag-area="">
                  <div className="headerInner">
                    <div className="chrome">
                      <div className="handle" />
                      <span className="dragHint">↕ Drag this header</span>
                    </div>
                    <div className="headerRow">
                      <Drawer.Close className="back" aria-label="Back">
                        ‹
                      </Drawer.Close>
                      <Drawer.Title className="title">
                        Delivery address
                      </Drawer.Title>
                      <button
                        onClick={() => {
                          setAdded((value) => value + 1);
                          record("Add clicked");
                        }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </header>
                <Drawer.Description className="visuallyHidden">
                  Choose a delivery address. Drag the header to expand, collapse
                  or close.
                </Drawer.Description>
                <div
                  className="addresses"
                  role="radiogroup"
                  aria-label="Delivery addresses"
                >
                  {addresses.map((name, index) => (
                    <label className="address" key={name}>
                      <span className="pin" aria-hidden="true">
                        ⌂
                      </span>
                      <span className="addressText">
                        <strong>{name}</strong>
                        <small>{streets[index % streets.length]}</small>
                      </span>
                      <input
                        type="radio"
                        name="address"
                        value={name}
                        checked={selected === name}
                        onChange={() => setSelected(name)}
                      />
                    </label>
                  ))}
                </div>
              </Drawer.Content>
              <footer className="footer">
                <Drawer.Close>Use this address</Drawer.Close>
              </footer>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
