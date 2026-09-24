// Suite definition in the shape of Speedometer's resources/tests.mjs, so it
// can be dropped into the Speedometer repository by swapping the import below
// for resources/benchmark-runner.mjs.
import { BenchmarkTestStep } from "../runner/runner.mjs";

const app = ["shop-app"];

// Every step waits for Fluent to finish translating what the step rendered.
const whenTranslated = (page) => page.call("whenTranslated");

const click = (selector, path = app) => (page) => {
  page.querySelector(selector, path).click();
  return whenTranslated(page);
};

const select = (selector, value) => (page) => {
  const element = page.querySelector(selector, app);
  element.setValue(value);
  element.dispatchEvent("change");
  return whenTranslated(page);
};

const steps = (count, name, makeStep) =>
  Array.from(
    { length: count },
    (_, i) => new BenchmarkTestStep(`${name}${i + 1}`, makeStep(i + 1)),
  );

export default {
  name: "Shop-LitFluent",
  url: "index.html",
  tags: ["experimental", "webcomponents"],
  async prepare(page) {
    await page.waitForElement("shop-app");
    await whenTranslated(page);
  },
  tests: [
    ...steps(10, "LoadMore", () => click("#show-more")),
    new BenchmarkTestStep("SwitchCurrency", select("#currency", "USD")),
    new BenchmarkTestStep("FilterKitchen", click('[data-category="kitchen"]')),
    new BenchmarkTestStep("ClearFilter", click('[data-category="all"]')),
    new BenchmarkTestStep("SortByPrice", select("#sort", "price")),
    ...steps(5, "AddToCart", (n) =>
      click("button", [...app, `product-card:nth-child(${n} of [in-stock])`]),
    ),
    new BenchmarkTestStep("SwitchLanguage", select("#language", "de")),
  ],
};
