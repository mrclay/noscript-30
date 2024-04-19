import { readFileSync } from "node:fs";
import express from "express";
import { escape } from "html-escaper";

const app = express();
const port = 3000;

app.use(express.static("public"));

interface Projectile {
  x: number;
  y: number;
  destroyed?: boolean;
}

interface UserState {
  active: boolean;
  projectiles: Projectile[];
  enemies: Projectile[];
  explosions: Projectile[];
  shots: number;
  startedAt: number;
  endedAt: number;
}

const initState: UserState = {
  active: true,
  projectiles: [],
  enemies: [
    { x: 5, y: 5 },
    { x: 10, y: 3 },
  ],
  explosions: [],
  shots: 0,
  startedAt: 0,
  endedAt: 0,
};

// Just using global state for v0
let state = structuredClone(initState);

const projectile = { h: 20, w: 20 };

app.get("/fire", async (req, res) => {
  res.setHeader("Cache-Control", "no-cache");

  if (state.active) {
    const x = Number(req.query.player);
    if (x >= 0 && x <= 20) {
      state.projectiles.push({ x, y: 20 });
    }
    state.shots++;
  }

  res.send("OK");
  res.end();
});

app.get("/stream", async (req, res) => {
  res.setHeader("Cache-Control", "no-cache");

  if (req.query.restart) {
    state = structuredClone(initState);
  }

  if (!state.active) {
    const formatter = new Intl.NumberFormat("en-US", {});
    let html = String(readFileSync(__dirname + "/public/game-over.html"));
    const elapsed = Math.round((state.endedAt - state.startedAt) / 1e3);
    const score = Math.round(1000000 / (elapsed + state.shots));

    res.send(
      html
        .replace("{{ELAPSED}}", formatter.format(elapsed))
        .replace("{{NUMSHOTS}}", String(state.shots))
        .replace("{{SCORE}}", formatter.format(score)),
    );
    res.end();
    return;
  }

  if (!state.startedAt) {
    state.startedAt = new Date().getTime();
  }

  const pageLifeSec = 5;
  const fps = 5;

  res.setHeader("Content-Type", "text/html");
  res.flushHeaders();
  res.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="refresh" content="0; url=/stream">
      <title>(streaming content)</title>
      <link rel="stylesheet" href="/style.css" />
    </head>
    <body>
  `);

  let keepGoing = true;

  function render() {
    // cleanup
    state.projectiles = state.projectiles.filter((el) => !el.destroyed);
    state.enemies = state.enemies.filter((el) => !el.destroyed);
    state.explosions = [];

    state.projectiles.forEach((el) => {
      el.y--;
      if (el.y < 0) {
        el.destroyed = true;
      } else {
        if (
          state.enemies
            .filter((enemy) => enemy.x === el.x && enemy.y === el.y)
            .map((enemy) => {
              enemy.destroyed = true;
            }).length
        ) {
          el.destroyed = true;
          state.explosions.push({ x: el.x, y: el.y });
        }
      }
    });

    if (!state.enemies.length) {
      state.active = false;
      state.endedAt = new Date().getTime();
    }
    if (!state.active) {
      keepGoing = false;
    }

    return [
      ...state.enemies.map((el) => {
        const top = el.y * projectile.w;
        const left = el.x * projectile.h;
        const style = `top:${top}px; left:${left}px`;
        return `<div class="enemy" style="${escape(style)}">👾</div>`;
      }),
      ...state.projectiles.map((el) => {
        const top = el.y * projectile.w;
        const left = el.x * projectile.h;
        const style = `top:${top}px; left:${left}px`;
        return `<div class="projectile" style="${escape(style)}"></div>`;
      }),
      ...state.explosions.map((el) => {
        const top = el.y * projectile.w;
        const left = el.x * projectile.h;
        const style = `top:${top}px; left:${left}px`;
        return `<div class="explosion" style="${escape(style)}"><span>✵</span></div>`;
      }),
    ].join("");
  }

  res.on("close", () => {
    if (keepGoing) {
      console.log("Browser gave up");
    }
    keepGoing = false;
  });

  setTimeout(() => {
    keepGoing = false;
  }, pageLifeSec * 1e3);

  // "Game" loop
  while (keepGoing) {
    const html = render();
    res.write(`<div class="frame">${html}</div>`);

    await new Promise((res) => setTimeout(res, 1e3 / fps));
  }

  res.write("</body></html>");
  res.end();
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
