// Desktop shell: starts the Next.js server inside Electron and shows it in a window.
const { app, BrowserWindow, dialog, shell } = require("electron");
const http = require("node:http");
const path = require("node:path");

const smokeTest = process.env.MEALBUDDY_SMOKE === "1";

async function startServer() {
  // Keep the database with the user's app data so updates and reinstalls keep it.
  process.env.MEALBUDDY_DB ??= path.join(app.getPath("userData"), "mealbuddy.db");
  const next = require("next");
  const nextApp = next({ dir: app.getAppPath(), dev: false });
  await nextApp.prepare();
  const handle = nextApp.getRequestHandler();
  const server = http.createServer((req, res) => handle(req, res));
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return `http://127.0.0.1:${server.address().port}`;
}

function createWindow(url) {
  const win = new BrowserWindow({
    width: 1320,
    height: 880,
    minWidth: 900,
    minHeight: 600,
    title: "MealBuddy",
    backgroundColor: "#f5f9fc",
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true },
  });
  // Recipe source links and videos open in the normal browser.
  win.webContents.setWindowOpenHandler(({ url: target }) => {
    if (/^https?:\/\//.test(target)) shell.openExternal(target);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (event, target) => {
    if (!target.startsWith(url)) {
      event.preventDefault();
      if (/^https?:\/\//.test(target)) shell.openExternal(target);
    }
  });
  win.loadURL(url);
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(async () => {
    try {
      const url = await startServer();
      if (smokeTest) {
        const res = await fetch(url);
        console.log(`MEALBUDDY_SMOKE ${res.status} ${url}`);
        app.exit(res.ok ? 0 : 1);
        return;
      }
      createWindow(url);
      app.on("activate", () => BrowserWindow.getAllWindows().length === 0 && createWindow(url));
    } catch (err) {
      console.error(err);
      if (!smokeTest) dialog.showErrorBox("MealBuddy could not start", String(err?.stack ?? err));
      app.exit(1);
    }
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
