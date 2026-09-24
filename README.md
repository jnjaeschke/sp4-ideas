# Speedometer 4 ideas

Workload ideas for Speedometer 4, the successor of
[Speedometer 3.1](https://github.com/WebKit/Speedometer). Each idea is in its
own folder, with a README that explains what it tests and why.

| Idea | Try it | What it tests |
| --- | --- | --- |
| [Editor-HighlightAPI](editor-highlight-api/README.md) | [Editor](https://jnjaeschke.github.io/sp4-ideas/editor-highlight-api/) | Code editor that highlights syntax with Prism and the CSS Custom Highlight API. Tests tens of thousands of `Range`s in `Highlight`s, and `::highlight()` layout and painting. |
| [Shop-LitFluent](shop-lit-fluent/README.md) | [Shop](https://jnjaeschke.github.io/sp4-ideas/shop-lit-fluent/), [runner](https://jnjaeschke.github.io/sp4-ideas/shop-lit-fluent/runner.html) | Online shop built from Lit web components, localized with Fluent. Tests one `MutationObserver` registered on hundreds of shadow roots, with heavy observe/disconnect churn ([bug 1988776](https://bugzilla.mozilla.org/show_bug.cgi?id=1988776)). |

## Running locally

Serve the repository root over HTTP, for example with
`python3 -m http.server`, and open <http://localhost:8000/>. The pages use
`fetch()` and ES modules, so they do not work from `file://`.

## License

[MPL-2.0](LICENSE), except for the third-party files listed in
[THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md).
