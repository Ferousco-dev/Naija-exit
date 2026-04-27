import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, "dist");
const indexFile = path.join(distDir, "index.html");
const PORT = Number(process.env.PORT) || 8080;
const HOST = "0.0.0.0";

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    "Content-Type": contentTypes[ext] || "application/octet-stream",
  });
  createReadStream(filePath).pipe(res);
}

function sendError(res, statusCode, message) {
  res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(message);
}

const server = http.createServer(async (req, res) => {
  try {
    const requestPath = new URL(req.url, `http://${req.headers.host || "localhost"}`).pathname;
    const normalizedPath = path.normalize(decodeURIComponent(requestPath)).replace(/^(\.\.[/\\])+/, "");
    let filePath = path.join(distDir, normalizedPath);

    if (normalizedPath === "/") {
      filePath = indexFile;
    }

    if (existsSync(filePath)) {
      const fileStats = await stat(filePath);
      if (fileStats.isDirectory()) {
        const nestedIndex = path.join(filePath, "index.html");
        if (existsSync(nestedIndex)) {
          sendFile(res, nestedIndex);
          return;
        }
      } else {
        sendFile(res, filePath);
        return;
      }
    }

    if (existsSync(indexFile)) {
      sendFile(res, indexFile);
      return;
    }

    sendError(res, 404, "Build output not found. Run `npm run build` before starting the server.");
  } catch (error) {
    console.error(error);
    sendError(res, 500, "Internal server error");
  }
});

console.log("APP STARTING...");
server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
