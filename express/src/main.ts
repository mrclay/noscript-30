import { readFileSync } from "node:fs";
import express from "express";
import { escape } from "html-escaper";

const app = express();
const port = 3000;

app.use(express.static("public"));

interface XY {
  x: number;
  y: number;
  destroyed?: boolean;
}

interface UserState {
  active: boolean;
  projectiles: XY[];
  enemyOffsets: XY[];
  explosions: XY[];
  score: number;
  startedAt: number;
  endedAt: number;
  frame: number;
  enemiesTopCenter: XY;
}

const initState: UserState = {
  active: true,
  projectiles: [],
  enemyOffsets: [],
  explosions: [],
  score: 0,
  startedAt: 0,
  endedAt: 0,
  frame: 0,
  enemiesTopCenter: { x: 12, y: 1 },
};

// Just using global state for v0
let state = structuredClone(initState);

const projectile = { h: 20, w: 20 };

app.get("/fire", async (req, res) => {
  res.setHeader("Cache-Control", "no-cache");

  if (state.active && state.projectiles.length < 3) {
    const x = Number(req.query.player);
    if (x >= 0 && x <= 24) {
      state.projectiles.push({ x, y: 14 });
    }
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

    res.send(
      html
        .replace("{{ELAPSED}}", formatter.format(elapsed))
        .replace("{{SCORE}}", formatter.format(state.score)),
    );
    res.end();
    return;
  }

  if (state.frame === 0) {
    state.startedAt = new Date().getTime();
    state.enemyOffsets = [];
    for (let x = -5; x <= 1; x++) {
      for (let y = 0; y <= 3; y++) {
        state.enemyOffsets.push({ x: x * 2, y: y * 2 });
      }
    }
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
    state.enemyOffsets = state.enemyOffsets.filter((el) => !el.destroyed);
    state.explosions = [];

    const div4 = Math.floor(state.frame / 4);
    const mod2 = div4 % 2 === 0;
    const mod16 = div4 % 16;
    let x = 0;
    if (mod16 <= 7) {
      x = mod16;
    } else if (mod16 === 8) {
      x = 7;
    } else {
      x = 15 - mod16;
    }

    if (state.frame % 4 === 0) {
      // Move horde
      state.enemiesTopCenter.x = x + 12;
      if ([0, 8].includes(mod16)) {
        state.enemiesTopCenter.y++;
      }
    }

    const minY = Math.max(
      ...state.enemyOffsets.map((offset) => {
        return state.enemiesTopCenter.y + offset.y;
      }),
    );
    if (minY >= 14) {
      state.active = false;
      state.endedAt = new Date().getTime();
    }

    state.projectiles.forEach((el) => {
      el.y--;
      if (el.y < 0) {
        el.destroyed = true;
      } else {
        if (
          state.enemyOffsets
            .filter((offset) => {
              const x = state.enemiesTopCenter.x + offset.x;
              const y = state.enemiesTopCenter.y + offset.y;
              return x === el.x && y === el.y;
            })
            .map((offset) => {
              offset.destroyed = true;
            }).length
        ) {
          el.destroyed = true;
          state.score += 150;
          state.explosions.push({ x: el.x, y: el.y });
        }
      }
    });

    if (!state.enemyOffsets.length) {
      state.active = false;
      state.endedAt = new Date().getTime();
    }
    if (!state.active) {
      keepGoing = false;
    }

    let debug = `
      <div style="margin-top:200px">${minY}</div>
    `;
    debug = "";

    return (
      [
        ...state.enemyOffsets.map((offset) => {
          const top = (state.enemiesTopCenter.y + offset.y) * projectile.w;
          const left = (state.enemiesTopCenter.x + offset.x) * projectile.h;
          const style = `top:${top}px; left:${left}px`;
          return `<div class="enemy" data-even="${mod2 ? "" : 1}" style="${escape(style)}">👾</div>`;
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
      ].join("") + debug
    );
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
    state.frame++;
    let html = render();
    res.write(`<div class="frame">${html}</div>`);

    await new Promise((res) => setTimeout(res, 1e3 / fps));
  }

  res.write("</body></html>");
  res.end();
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
