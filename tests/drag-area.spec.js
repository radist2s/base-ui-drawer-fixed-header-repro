import { test, expect } from "@playwright/test";

const url = process.env.DEMO_URL ?? "http://localhost:63102";

test.use({
  channel: "chrome",
  viewport: { width: 900, height: 844 },
});

async function settled(page) {
  await expect
    .poll(() =>
      page
        .locator(".popup")
        .evaluate((element) => element.getAnimations().length),
    )
    .toBe(0);
}

async function drag(page, selector, deltaY) {
  const box = await page.locator(selector).boundingBox();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let step = 1; step <= 30; step += 1) {
    await page.mouse.move(x, y + (deltaY * step) / 30);
    await page.waitForTimeout(16);
  }
  await page.mouse.up();
}

test("mouse drag on the marked header expands, collapses and dismisses a scrolled drawer", async ({
  page,
}) => {
  await page.goto(url);
  await settled(page);
  await page
    .getByRole("button", { name: "Toggle list scroll", exact: true })
    .click();
  await expect(page.getByTestId("status")).toContainText("Scroll: 150px");

  await drag(page, ".title", -270);
  await expect(page.getByTestId("status")).toContainText("Expanded");
  await settled(page);
  expect(
    await page.locator(".content").evaluate((element) => element.scrollTop),
  ).toBe(150);

  await drag(page, ".title", 300);
  await expect(page.getByTestId("status")).toContainText("Compact");
  await settled(page);
  expect(
    await page.locator(".content").evaluate((element) => element.scrollTop),
  ).toBe(150);

  await drag(page, ".chrome", 310);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByTestId("status")).toContainText("Closed");
});

test("interactive controls remain excluded from mouse dragging and Add clicks normally", async ({
  page,
}) => {
  await page.goto(url);
  await settled(page);
  const add = page.getByRole("button", { name: "Add", exact: true });

  await drag(page, ".headerRow button:last-child", -270);
  await expect(page.getByTestId("status")).toContainText("Compact");
  await expect(page.getByTestId("status")).toContainText("Added: 0");

  await add.click();
  await expect(page.getByRole("radio")).toHaveCount(13);
  await expect(page.getByTestId("status")).toContainText("Added: 1");
  await expect(page.getByTestId("status")).toContainText("Compact");
});

test("mouse drag on the Content body does not move the drawer", async ({
  page,
}) => {
  await page.goto(url);
  await settled(page);

  await drag(page, ".address:nth-child(2) .addressText", -270);
  await expect(page.getByTestId("status")).toContainText("Compact");
  await expect(page.getByRole("dialog")).toHaveCount(1);
});

test("data-base-ui-swipe-ignore takes priority over the drag-area marker", async ({
  page,
}) => {
  await page.goto(url);
  await settled(page);
  await page.locator(".title").evaluate((element) => {
    element.setAttribute("data-base-ui-swipe-ignore", "");
  });

  await drag(page, ".title", -270);
  await expect(page.getByTestId("status")).toContainText("Compact");
});

test("a fixed header without the drag-area marker remains blocked", async ({
  page,
}) => {
  await page.goto(url);
  await settled(page);
  await page.locator(".header").evaluate((element) => {
    element.removeAttribute("data-base-ui-drag-area");
  });

  await drag(page, ".chrome", -270);
  await expect(page.getByTestId("status")).toContainText("Compact");
});

test("a scrollable descendant inside the drag area keeps its own interaction", async ({
  page,
}) => {
  await page.goto(url);
  await settled(page);
  await page.locator(".chrome").evaluate((element) => {
    const scroller = document.createElement("div");
    scroller.className = "testScroller";
    scroller.style.cssText =
      "position:absolute;left:8px;top:2px;width:48px;height:20px;overflow:auto;touch-action:auto";
    scroller.innerHTML = '<div style="height:100px">Scrollable test area</div>';
    element.append(scroller);
  });

  const scroller = page.locator(".testScroller");
  await scroller.hover();
  await page.mouse.wheel(0, 60);
  await expect
    .poll(() => scroller.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);
  await expect(page.getByTestId("status")).toContainText("Compact");

  await drag(page, ".testScroller", -270);
  await expect(page.getByTestId("status")).toContainText("Compact");
});
