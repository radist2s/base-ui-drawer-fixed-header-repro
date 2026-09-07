import { test, expect } from "@playwright/test";

const url = process.env.DEMO_URL ?? "http://localhost:63100";
const patched = process.env.EXPECT_PATCHED === "1";
test.use({
  channel: "chrome",
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});

async function settled(page) {
  await expect
    .poll(() =>
      page.locator(".popup").evaluate((el) => el.getAnimations().length),
    )
    .toBe(0);
}

async function swipe(page, selector, deltaY) {
  const box = await page.locator(selector).boundingBox();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  const client = await page.context().newCDPSession(page);
  try {
    await client.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y }],
    });
    // Start with a small movement: Base UI absorbs the first touchmove as slop.
    for (let step = 1; step <= 30; step++) {
      await client.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y: y + (deltaY * step) / 30 }],
      });
      await new Promise((resolve) => setTimeout(resolve, 16));
    }
    await client.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  } finally {
    await client.detach();
  }
}

test("long list: upward header swipe distinguishes the patch", async ({
  page,
}) => {
  await page.goto(url);
  await settled(page);
  await swipe(page, ".chrome", -270);
  await expect(page.getByTestId("status")).toContainText(
    patched ? "Expanded" : "Compact",
  );
  await settled(page);
  expect(await page.locator(".content").evaluate((el) => el.scrollTop)).toBe(0);
});

test("scrolled list: header collapses and dismisses without scrolling the list", async ({
  page,
}) => {
  await page.goto(url);
  await settled(page);
  await page
    .getByRole("button", { name: "Toggle list scroll", exact: true })
    .click();
  await expect(page.getByTestId("status")).toContainText("Scroll: 150px");
  await page.getByRole("button", { name: "Expanded", exact: true }).click();
  await settled(page);
  await swipe(page, ".title", 300);
  await expect(page.getByTestId("status")).toContainText(
    patched ? "Compact" : "Expanded",
  );
  await settled(page);
  expect(await page.locator(".content").evaluate((el) => el.scrollTop)).toBe(
    150,
  );
  if (patched) {
    await swipe(page, ".title", -270);
    await expect(page.getByTestId("status")).toContainText("Expanded");
    await settled(page);
    expect(await page.locator(".content").evaluate((el) => el.scrollTop)).toBe(
      150,
    );
    await swipe(page, ".title", 300);
    await expect(page.getByTestId("status")).toContainText("Compact");
    await settled(page);
    await swipe(page, ".chrome", 310);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByTestId("status")).toContainText("Closed");
  }
});

test("list touch scroll preserves fixed header, glass effect and bottom action", async ({
  page,
}) => {
  await page.goto(`${url}/?snap=expanded`);
  await settled(page);
  const header = page.locator(".header");
  const before = await header.boundingBox();
  await swipe(page, ".address:nth-child(4)", -170);
  await expect
    .poll(() => page.locator(".content").evaluate((el) => el.scrollTop))
    .toBeGreaterThan(100);
  await expect(page.getByTestId("status")).toContainText("Expanded");
  const after = await header.boundingBox();
  expect(after.y).toBeCloseTo(before.y, 0);
  await expect
    .poll(() =>
      header.evaluate((el) => getComputedStyle(el, "::before").opacity),
    )
    .toBe("1");
  expect((await page.locator(".footer").boundingBox()).y + 78).toBeCloseTo(
    844,
    0,
  );
});

test("one-address control has no overflow and buttons remain functional", async ({
  page,
}) => {
  await page.goto(`${url}/?list=short`);
  await settled(page);
  await expect(page.getByRole("radio")).toHaveCount(1);
  const size = await page
    .locator(".content")
    .evaluate((el) => ({ height: el.clientHeight, content: el.scrollHeight }));
  expect(size.content).toBe(size.height);
  await swipe(page, ".chrome", -270);
  await expect(page.getByTestId("status")).toContainText("Expanded");
  await settled(page);
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByRole("radio")).toHaveCount(2);
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Compact", exact: true }).click();
  await settled(page);
  await page
    .getByRole("button", { name: "Use this address", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("drag starting on Add does not trigger its click", async ({ page }) => {
  await page.goto(url);
  await settled(page);
  await swipe(page, ".headerRow button:last-child", -270);
  await expect(page.getByRole("radio")).toHaveCount(12);
  await expect(page.getByTestId("status")).toContainText("Added: 0");
  if (patched)
    await expect(page.getByTestId("status")).toContainText("Expanded");
});
