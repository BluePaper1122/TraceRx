import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const output = path.resolve("artifacts", "resistlens-qa");
await mkdir(output, { recursive: true });

const browser = await chromium.launch({ headless: true });
try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1100 } });

  await desktop.goto("https://antibiotic-resistance-tool.onrender.com/", {
    waitUntil: "networkidle",
    timeout: 90000,
  });
  await desktop.screenshot({ path: path.join(output, "reference-tool.png"), fullPage: true });

  await desktop.goto("https://resistlens.onrender.com/", {
    waitUntil: "networkidle",
    timeout: 90000,
  });
  await desktop.screenshot({ path: path.join(output, "live-resistlens.png"), fullPage: true });

  await desktop.goto("http://127.0.0.1:8010/", {
    waitUntil: "networkidle",
    timeout: 30000,
  });
  await desktop.getByRole("button", { name: "Synthetic model lab" }).click();
  await desktop.getByText("Separate, synthetic teaching model").waitFor();
  await desktop.screenshot({ path: path.join(output, "local-model-lab.png"), fullPage: true });
  await desktop.getByRole("button", { name: "Rank synthetic candidates" }).click();
  await desktop.getByText("#1", { exact: true }).waitFor();
  await desktop.screenshot({ path: path.join(output, "local-ranked.png"), fullPage: true });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto("http://127.0.0.1:8010/", {
    waitUntil: "networkidle",
    timeout: 30000,
  });
  await mobile.getByRole("button", { name: "Navigation" }).click();
  await mobile.getByRole("button", { name: "Synthetic model lab" }).click();
  await mobile.getByText("Separate, synthetic teaching model").waitFor();
  await mobile.screenshot({ path: path.join(output, "local-model-lab-mobile.png"), fullPage: true });

  console.log(JSON.stringify({
    title: await desktop.title(),
    desktopUrl: desktop.url(),
    rankedRows: await desktop.locator(".ranking-list li").count(),
    desktopHorizontalOverflow: await desktop.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
    mobileHorizontalOverflow: await mobile.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
    output,
  }, null, 2));
} finally {
  await browser.close();
}
