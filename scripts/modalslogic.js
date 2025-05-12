/*  modalslogic.js  —  Win-98-style desktop */

(() => {
  /* ───────────── helpers ───────────── */
  const $ = (s) => document.querySelector(s);
  const taskbar = document.querySelector(".modal-buttons");
  let z = 10;

  /* make any window draggable via its title-bar (except the control btns) */
  const makeDrag = (win) => {
    const bar = win.querySelector(".title-bar");
    let dx = 0,
      dy = 0,
      drag = false;
    bar.addEventListener("mousedown", (e) => {
      if (e.target.closest(".title-bar-controls")) return;
      drag = true;
      dx = win.offsetLeft - e.clientX;
      dy = win.offsetTop - e.clientY;
    });
    document.addEventListener("mouseup", () => (drag = false));
    document.addEventListener("mousemove", (e) => {
      if (!drag) return;
      win.style.left = `${e.clientX + dx}px`;
      win.style.top = `${e.clientY + dy}px`;
    });
  };

  /* create (or reuse) a task-bar button */
  const taskBtn = (id, icon, label) => {
    let b = document.getElementById(id);
    if (b) return b;
    b = document.createElement("button");
    b.id = id;
    b.innerHTML = `<img src="${icon}" alt="">${label}`;
    taskbar.appendChild(b);
    return b;
  };

  /* generic open / minimise / close wiring */
  const wire = ({
    iconId,
    modalId,
    minId,
    closeId,
    btnId,
    btnIcon,
    btnLabel,
    pos,
  }) => {
    const icon = $(`#${iconId}`);
    const win = $(`#${modalId}`);
    if (!icon || !win) return console.warn(`Missing ${iconId}/${modalId}`);

    const min = minId ? $(`#${minId}`) : null;
    const cls = closeId ? $(`#${closeId}`) : null;
    const btn = taskBtn(btnId, btnIcon, btnLabel);
    btn.style.display = "none";

    const show = () => (win.style.display = "block");
    const hide = () => (win.style.display = "none");

    icon.addEventListener("click", (e) => {
      e.preventDefault();
      show();
      btn.style.display = "flex";
      win.style.zIndex = ++z;
      if (pos && innerWidth > 900) Object.assign(win.style, pos);
    });
    min?.addEventListener("click", hide);
    cls?.addEventListener("click", () => {
      hide();
      btn.style.display = "none";
    });
    btn.addEventListener("click", () =>
      win.style.display === "none" ? show() : hide()
    );

    win.addEventListener("mousedown", () => (win.style.zIndex = ++z));
    makeDrag(win);
  };

  /* ─────────── wired windows ─────────── */

  wire({
    iconId: "myComputer",
    modalId: "myComputerModal",
    minId: "min1",
    closeId: "close1",
    btnId: "btnMyComputer",
    btnIcon: "img/risorse.ico",
    btnLabel: "My Computer",
    pos: { left: "200px", top: "200px" },
  });

  wire({
    iconId: "myProjects",
    modalId: "projectsModal",
    minId: "min2",
    closeId: "close2",
    btnId: "btnProjects",
    btnIcon: "img/projects.ico",
    btnLabel: "Projects",
    pos: { left: "550px", top: "200px" },
  });

  wire({
    iconId: "cmdPrompt",
    modalId: "cmdModal",
    minId: "min3",
    closeId: "close3",
    btnId: "btnCmd",
    btnIcon: "img/console.ico",
    btnLabel: "Console",
    pos: { left: "150px", top: "200px" },
  });

  wire({
    iconId: "socialIcon",
    modalId: "socialModal",
    minId: "min7",
    closeId: "close7",
    btnId: "btnSocial",
    btnIcon: "img/insta.png",
    btnLabel: "Social",
    pos: { left: "550px", top: "200px" },
  });
})();
