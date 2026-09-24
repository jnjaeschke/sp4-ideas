// Minimal stand-in for Speedometer's benchmark runner. It loads the suite in
// an iframe and times each step the way Speedometer's "async" step scheduler
// does (resources/shared/step-scheduler.mjs): the step runs in a rAF callback
// (sync time), and a timer queued from a second rAF callback in the same frame
// marks the end of the async time, i.e. after style, layout and paint of that
// frame. If the step returns a promise, the async time also lasts until the
// promise resolves.

export class BenchmarkTestStep {
  constructor(testName, testFunction) {
    this.name = testName;
    this.run = testFunction;
  }
}

class PageElement {
  #node;

  constructor(node) {
    this.#node = node;
  }

  click() {
    this.#node.click();
  }

  setValue(value) {
    this.#node.value = value;
  }

  dispatchEvent(eventName) {
    this.#node.dispatchEvent(new Event(eventName, { bubbles: true }));
  }
}

class Page {
  #frame;

  constructor(frame) {
    this.#frame = frame;
  }

  // Unlike Speedometer's Page.call(), this returns the function's result, so
  // steps can return the app's promises.
  call(functionName) {
    return this.#frame.contentWindow[functionName]();
  }

  querySelector(selector, path = []) {
    const parent = path.reduce((root, pathSelector) => {
      const node = root.querySelector(pathSelector);
      return node.shadowRoot ?? node;
    }, this.#frame.contentDocument);
    const element = parent.querySelector(selector);
    return element && new PageElement(element);
  }

  querySelectorAll(selector, path = []) {
    const parent = path.reduce((root, pathSelector) => {
      const node = root.querySelector(pathSelector);
      return node.shadowRoot ?? node;
    }, this.#frame.contentDocument);
    return Array.from(
      parent.querySelectorAll(selector),
      (element) => new PageElement(element),
    );
  }

  waitForElement(selector) {
    return new Promise((resolve) => {
      const resolveIfReady = () => {
        const element = this.querySelector(selector);
        if (element) {
          resolve(element);
        } else {
          requestAnimationFrame(resolveIfReady);
        }
      };
      resolveIfReady();
    });
  }
}

function runStep(step, page) {
  return new Promise((resolve) => {
    let syncStart, syncEnd;
    let stepDone = false;
    let frameDone = false;
    const tryFinish = () => {
      if (!stepDone || !frameDone) {
        return;
      }
      const asyncEnd = performance.now();
      setTimeout(
        () => resolve({ sync: syncEnd - syncStart, async: asyncEnd - syncEnd }),
        0,
      );
    };
    requestAnimationFrame(async () => {
      syncStart = performance.now();
      const result = step.run(page);
      syncEnd = performance.now();
      await result;
      stepDone = true;
      tryFinish();
    });
    requestAnimationFrame(() => {
      setTimeout(() => {
        frameDone = true;
        tryFinish();
      }, 0);
    });
  });
}

function loadFrame(frame, url) {
  return new Promise((resolve) => {
    frame.addEventListener("load", resolve, { once: true });
    frame.src = url;
  });
}

// Loads `<name>/tests.mjs` from the repository root and resolves the suite's
// URL relative to it.
export async function loadSuite(name) {
  const testsUrl = new URL(`../${name}/tests.mjs`, import.meta.url);
  const { default: suite } = await import(testsUrl);
  return { ...suite, url: new URL(suite.url, testsUrl).href };
}

// Runs the suite `iterations` times, each in a freshly loaded frame, and
// returns one { [stepName]: { sync, async } } object per iteration.
// `afterStep(stepName, frameWindow)` runs after each step, outside the timing.
export async function runSuite(suite, frame, iterations, { afterStep } = {}) {
  const results = [];
  for (let i = 0; i < iterations; i++) {
    await loadFrame(frame, suite.url);
    const page = new Page(frame);
    await suite.prepare(page);
    const iteration = {};
    for (const step of suite.tests) {
      iteration[step.name] = await runStep(step, page);
      afterStep?.(step.name, frame.contentWindow);
    }
    results.push(iteration);
  }
  return results;
}
