// Suite definition in the shape of Speedometer's resources/tests.mjs, so it
// can be dropped into the Speedometer repository by swapping the import below
// for resources/benchmark-runner.mjs.
import { BenchmarkTestStep } from "../runner/runner.mjs";

// Every step waits until the editor has highlighted and painted.
const open = (sample) => (page) => {
  page.querySelector("#sample").setValue(sample);
  page.querySelector("#insert").click();
  return page.call("whenIdle");
};

const steps = (count, name, makeStep) =>
  Array.from(
    { length: count },
    (_, i) => new BenchmarkTestStep(`${name}${i + 1}`, makeStep(i + 1)),
  );

export default {
  name: "Editor-HighlightAPI",
  url: "index.html",
  tags: ["experimental"],
  async prepare(page) {
    await page.waitForElement("#code");
    await page.call("preloadSamples");
    await page.call("whenIdle");
  },
  tests: [
    new BenchmarkTestStep("OpenJQuery", open("samples/jquery-3.7.1.js")),
    ...steps(5, "TypeCharacter", () => (page) => page.call("typeCharacter")),
    new BenchmarkTestStep("ScrollToEnd", (page) => page.call("scrollToEnd")),
    new BenchmarkTestStep("OpenBootstrap", open("samples/bootstrap-5.3.3.css")),
  ],
};
