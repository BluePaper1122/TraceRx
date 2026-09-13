import { test, expect } from "@playwright/test"

test("transfer history changes evidence state", async ({ page }) => {
  await page.goto("/patients/10")

  await expect(page.getByText("24%").first()).toBeVisible()

  await expect(
    page.getByText(/External hospital records have not yet been retrieved/i)
  ).toBeVisible()

  await page
    .getByRole("button", { name: /retrieve verified external history/i })
    .click()

  await page.getByRole("button", { name: /apply evidence/i }).click()

  await expect(page.getByText("92%").first()).toBeVisible()

  await expect(page.getByText("72%").first()).toBeVisible()

  await expect(
    page.getByText(/verified external resistance history applied/i)
  ).toBeVisible()
})

test("Why sheet shows the evidence chain for a drug", async ({ page }) => {
  await page.goto("/patients/10")

  await page.getByRole("button", { name: "Why?" }).first().click()

  await expect(page.getByText(/Why is Ceftriaxone flagged/i)).toBeVisible()
  await expect(page.getByText(/Local hospital antibiogram/i)).toBeVisible()
  await expect(
    page.getByText(/Prototype research heuristic/i)
  ).toBeVisible()
})

test("patient roster highlights the demo patient", async ({ page }) => {
  await page.goto("/patients")

  await expect(page.getByText("Synthetic Patient #10").first()).toBeVisible()
  await expect(page.getByRole("button", { name: /open demo patient/i })).toBeVisible()
})
