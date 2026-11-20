/**
 * AIOrb — reusable floating AI orb (vanilla JS, no dependencies).
 *
 *   const orb = AIOrb.create({
 *     size: 62,                 // diameter in px (scaled to 87% on mobile)
 *     label: "Ask my AI",       // pill text, or "" for none
 *     labelMode: "subtle",      // "subtle" | "hover" | "always"
 *     ariaLabel: "Open AI companion",
 *     onClick: () => openChat()
 *   });
 *
 *   orb.setHidden(true | false);
 *   orb.setStatus("online" | "offline");
 *   orb.focus();
 *   orb.destroy();
 *
 *   AIOrb.createMini(22)  -> static mini orb element (for headers, avatars)
 */
(function (global) {
  "use strict";

  const ACTIVATION_DELAY_MS = 240;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function layer(name) {
    return el("span", "aio-layer aio-" + name);
  }

  function orbitHalf(side) {
    const half = el("span", "aio-orbit aio-orbit--" + side);
    half.append(el("span", "aio-ring"), el("span", "aio-spark"));
    return half;
  }

  function create(options) {
    const o = Object.assign(
      {
        size: 62,
        label: "Ask my AI",
        labelMode: "subtle",
        ariaLabel: "Open Ashutosh's AI companion",
        onClick: null,
        mount: document.body
      },
      options || {}
    );

    const reducedMotion = global.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = global.matchMedia("(hover: hover) and (pointer: fine)");

    // ---------- DOM ----------
    const root = el("button", "aio is-pre");
    root.type = "button";
    root.setAttribute("aria-label", o.ariaLabel);
    root.setAttribute("aria-haspopup", "dialog");
    root.setAttribute("aria-expanded", "false");
    root.dataset.label = o.labelMode;
    root.style.setProperty("--aio-size-base", o.size + "px");

    if (o.label) {
      const label = el("span", "aio-label");
      label.setAttribute("aria-hidden", "true");
      label.append(el("span", "aio-dot"), el("span", "aio-label-text", o.label));
      root.append(label);
    }

    const orb = el("span", "aio-orb");
    orb.setAttribute("aria-hidden", "true");

    const float = el("span", "aio-float");

    const body = el("span", "aio-body");
    const coreWrap = layer("core-wrap");
    coreWrap.append(el("span", "aio-core"));
    const specWrap = layer("spec-wrap");
    specWrap.append(el("span", "aio-spec"), el("span", "aio-glint"));

    body.append(
      layer("base"),
      layer("caustic"),
      layer("nebula"),
      coreWrap,
      layer("wisp"),
      layer("vignette"),
      layer("rim"),
      specWrap,
      layer("flare")
    );

    const backOrbit = orbitHalf("back");
    const frontOrbit = orbitHalf("front");

    float.append(el("span", "aio-halo"), backOrbit, body, frontOrbit);
    orb.append(float, el("span", "aio-pool"), el("span", "aio-focus"));
    root.append(orb);
    o.mount.append(root);

    // ---------- Orbit path (matches CSS ring geometry) ----------
    const sparks = root.querySelectorAll(".aio-spark");

    function updateOrbitPath() {
      const s = orb.offsetWidth || o.size;
      const pad = 8;
      const rx = (s * 1.62) / 2;
      const ry = (s * 0.46) / 2;
      const cy = pad + ry;
      const d =
        `path("M ${pad} ${cy} ` +
        `A ${rx} ${ry} 0 1 0 ${pad + rx * 2} ${cy} ` +
        `A ${rx} ${ry} 0 1 0 ${pad} ${cy}")`;
      sparks.forEach((sp) => (sp.style.offsetPath = d));
    }

    updateOrbitPath();
    const ro = "ResizeObserver" in global ? new ResizeObserver(updateOrbitPath) : null;
    if (ro) ro.observe(orb);

    // ---------- Intro ----------
    const introTimer = setTimeout(() => root.classList.remove("is-pre"), 450);

    // ---------- Pointer parallax ----------
    let targetX = 0, targetY = 0, curX = 0, curY = 0;
    let pointerX = null, pointerY = null;
    let rafId = 0;
    const INFLUENCE = 320; // px

    function computeTarget() {
      if (pointerX === null || root.classList.contains("is-hidden")) {
        targetX = targetY = 0;
        return;
      }
      const r = orb.getBoundingClientRect();
      const dx = pointerX - (r.left + r.width / 2);
      const dy = pointerY - (r.top + r.height / 2);
      const dist = Math.hypot(dx, dy) || 1;
      // Grows toward 1 at INFLUENCE, then fades out by 2×INFLUENCE
      const reach = Math.min(dist / INFLUENCE, 1);
      const falloff = dist <= INFLUENCE ? 1 : Math.max(0, 2 - dist / INFLUENCE);
      const mag = reach * falloff;
      targetX = (dx / dist) * mag;
      targetY = (dy / dist) * mag;
    }

    function tick() {
      computeTarget();
      curX += (targetX - curX) * 0.1;
      curY += (targetY - curY) * 0.1;
      root.style.setProperty("--aio-px", curX.toFixed(4));
      root.style.setProperty("--aio-py", curY.toFixed(4));

      if (Math.abs(targetX - curX) > 0.001 || Math.abs(targetY - curY) > 0.001) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = 0;
      }
    }

    function kick() {
      if (!rafId) rafId = requestAnimationFrame(tick);
    }

    function onPointerMove(e) {
      if (e.pointerType && e.pointerType !== "mouse") return;
      pointerX = e.clientX;
      pointerY = e.clientY;
      kick();
    }

    function onPointerLeave() {
      pointerX = pointerY = null;
      kick();
    }

    function enableParallax() {
      if (reducedMotion.matches || !finePointer.matches) return;
      global.addEventListener("pointermove", onPointerMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onPointerLeave);
    }

    function disableParallax() {
      global.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      pointerX = pointerY = null;
      kick();
    }

    function onMotionPrefChange() {
      disableParallax();
      enableParallax();
    }

    enableParallax();
    reducedMotion.addEventListener?.("change", onMotionPrefChange);
    finePointer.addEventListener?.("change", onMotionPrefChange);

    // ---------- Activation ----------
    let activationTimer = 0;

    function onActivate() {
      if (root.classList.contains("is-hidden")) return;
      if (typeof o.onClick !== "function") return;

      if (reducedMotion.matches) {
        o.onClick();
        return;
      }

      clearTimeout(activationTimer);
      root.classList.remove("is-activating");
      void root.offsetWidth; // restart flare animation
      root.classList.add("is-activating");

      const wave = el("span", "aio-wave");
      orb.append(wave);
      wave.addEventListener("animationend", () => wave.remove(), { once: true });

      activationTimer = setTimeout(() => {
        root.classList.remove("is-activating");
        o.onClick();
      }, ACTIVATION_DELAY_MS);
    }

    // Native <button> already maps Enter/Space to click
    root.addEventListener("click", onActivate);

    // ---------- Public API ----------
    return {
      element: root,
      setHidden(hidden) {
        root.classList.toggle("is-hidden", !!hidden);
        root.setAttribute("aria-expanded", hidden ? "true" : "false");
        root.tabIndex = hidden ? -1 : 0;
      },
      setStatus(status) {
        root.classList.toggle("is-offline", status === "offline");
      },
      setOnClick(fn) {
        o.onClick = fn;
      },
      focus() {
        root.focus({ preventScroll: true });
      },
      destroy() {
        clearTimeout(introTimer);
        clearTimeout(activationTimer);
        cancelAnimationFrame(rafId);
        disableParallax();
        reducedMotion.removeEventListener?.("change", onMotionPrefChange);
        finePointer.removeEventListener?.("change", onMotionPrefChange);
        if (ro) ro.disconnect();
        root.remove();
      }
    };
  }

  function createMini(size) {
    const mini = el("span", "aio-mini");
    mini.setAttribute("aria-hidden", "true");
    if (size) mini.style.setProperty("--aio-mini-size", size + "px");
    return mini;
  }

  global.AIOrb = { create, createMini };
})(window);
