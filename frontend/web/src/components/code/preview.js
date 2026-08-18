function isScript(name = "") {
  return /\.(jsx?|tsx?)$/i.test(name);
}

function isStyle(name = "") {
  return /\.css$/i.test(name);
}

export function toPreviewScript(content = "") {
  return String(content)
    .replace(/^\s*import\s+[^;]+;?\s*$/gm, "")
    .replace(/export\s+default\s+/g, "")
    .replace(/export\s+(function|const|class|let|var)\s+/g, "$1 ");
}

export function buildPreviewSrcDoc(files = []) {
  const list = (files || []).filter((file) => file && file.type !== "folder");
  const css = list.filter((file) => isStyle(file.name)).map((file) => file.content || "").join("\n");
  const scripts = list.filter((file) => isScript(file.name));
  const app = scripts.filter((file) => /(^|\/)App\.(jsx?|tsx?)$/i.test(file.name));
  const rest = scripts.filter((file) => !/(^|\/)App\.(jsx?|tsx?)$/i.test(file.name));
  const js = [...rest, ...app].map((file) => toPreviewScript(file.content || "")).join("\n\n");
  const safeJs = js.replace(/<\/script/gi, "<\\/script");
  const safeCss = css.replace(/<\/style/gi, "<\\/style");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>${safeCss}</style>
</head>
<body>
  <div id="root"></div>
  <script src="https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.development.js"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.development.js"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/@babel/standalone@7.26.10/babel.min.js"><\/script>
  <script>
    function report(level, message) {
      parent.postMessage({ type: "tyyari-preview", level: level, message: String(message || "") }, "*");
    }
    window.onerror = function (message) { report("error", message); };
    window.addEventListener("unhandledrejection", function (event) { report("error", event.reason); });
    ["log", "info", "warn", "error"].forEach(function (level) {
      var orig = console[level].bind(console);
      console[level] = function () {
        var text = Array.prototype.slice.call(arguments).map(String).join(" ");
        report(level === "log" ? "info" : level, text);
        orig.apply(console, arguments);
      };
    });
  <\/script>
  <script type="text/babel" data-presets="react">
    try {
${safeJs}
      if (typeof App !== "function") {
        throw new Error("Export a function named App from App.jsx");
      }
      const root = ReactDOM.createRoot(document.getElementById("root"));
      root.render(React.createElement(App));
      parent.postMessage({ type: "tyyari-preview", level: "ok", message: "" }, "*");
    } catch (error) {
      parent.postMessage({ type: "tyyari-preview", level: "error", message: error.message || String(error) }, "*");
    }
  <\/script>
</body>
</html>`;
}
