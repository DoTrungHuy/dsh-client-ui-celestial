// src/index.ts
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
var PLUGIN_ID = "dsh-client-ui-celestial";
var CLIENT_ROUTE = "/celestial-plugin/client.js";
var CLIENT_PATH = join(dirname(fileURLToPath(import.meta.url)), "client.js");
var SETTINGS_NS = "ui-celestial";
var inject = ["webServer"];
function shortHash(input) {
  return createHash("sha1").update(input).digest("hex").slice(0, 12);
}
function serveClient(body) {
  return (_req, res) => {
    res.writeHead(200, {
      "content-type": "text/javascript; charset=utf-8",
      "cache-control": "no-cache"
    });
    res.end(body);
  };
}
function injectBootRow(html, rev) {
  const row = {
    id: PLUGIN_ID,
    url: `${CLIENT_ROUTE}?rev=${rev}`,
    rev,
    inject: ["@deepseek-ai/dsh-client-ui-theme"],
    immediately: true
  };
  const script = `<script>(function(){var g=window.__DSH_BOOT__;if(!g||!Array.isArray(g.entries))return;if(g.entries.some(function(e){return e.id===${JSON.stringify(PLUGIN_ID)}}))return;g.entries.push(${JSON.stringify(row)});})();</script>`;
  const headEnd = html.indexOf("</head>");
  if (headEnd === -1) return `${html}${script}`;
  return `${html.slice(0, headEnd)}${script}${html.slice(headEnd)}`;
}
function celestialSchema(value) {
  return { enabled: value?.enabled !== false };
}
celestialSchema.toJSON = () => ({
  type: "object",
  properties: { enabled: { type: "boolean", default: true } }
});
function apply(ctx) {
  ctx.inject(["settings"], (settingsCtx) => {
    settingsCtx.settings.register(SETTINGS_NS, celestialSchema, { base: { enabled: true } });
  });
  const body = readFileSync(CLIENT_PATH);
  const rev = shortHash(body);
  ctx.effect(
    () => ctx.webServer.register({ kind: "exact", path: CLIENT_ROUTE, handler: serveClient(body) }),
    "celestial: client route"
  );
  ctx.effect(
    () => ctx.webServer.tapIndex((html) => injectBootRow(html, rev)),
    "celestial: boot row"
  );
}
export {
  apply,
  inject
};
