/* ============================================================
   SERVICE AREAS MAP — script.js
   ============================================================
   Everything that controls the pins lives in the LOCATIONS array
   below. To add, remove, or move a pin, edit this array only —
   the HTML/CSS never need to change.

   left / top  -> percentage position over the map image
                  (0% = far left/top edge, 100% = far right/bottom)
   x / y       -> the SAME point, but in the original artwork's
                  pixel space (630 × 680). These are only used to
                  draw the thin "cold-chain" route lines accurately
                  and can be left out if you don't want route lines.
   type        -> "hq" for the Vendum IQF Centre (magenta pin),
                  "service" for every regular service location
                  (gold pin).
   ============================================================ */

const LOCATIONS = [
  { id: "tada",        name: "Tada",        state: "Andhra Pradesh", left: 66.41, top: 34.72, x: 418.4, y: 236.1, type: "service" },
  { id: "chennai",      name: "Chennai",      state: "Tamil Nadu",     left: 66.36, top: 40.83, x: 418.1, y: 277.6, type: "service" },
  { id: "bengaluru",    name: "Bengaluru",    state: "Karnataka",      left: 33.68, top: 44.28, x: 212.2, y: 301.1, type: "service" },
  { id: "vellore",      name: "Vellore",      state: "Tamil Nadu",     left: 53.30, top: 45.04, x: 335.8, y: 306.3, type: "service" },
  { id: "hosur",        name: "Hosur",        state: "Tamil Nadu",     left: 42.95, top: 45.90, x: 270.6, y: 312.1, type: "service" },
  { id: "pochampalli",  name: "Pochampalli",  state: "Vendum IQF Centre", left: 46.62, top: 49.50, x: 293.7, y: 336.6, type: "hq" },
  { id: "mysore",       name: "Mysore",       state: "Karnataka",      left: 24.81, top: 52.50, x: 156.3, y: 357.0, type: "service" },
  { id: "pondicherry",  name: "Pondicherry",  state: "Puducherry",     left: 61.35, top: 57.49, x: 386.5, y: 390.9, type: "service" },
  { id: "salem",        name: "Salem",        state: "Tamil Nadu",     left: 43.43, top: 58.85, x: 273.6, y: 400.2, type: "service" },
  { id: "trichy",       name: "Trichy",       state: "Tamil Nadu",     left: 46.62, top: 62.59, x: 293.7, y: 425.6, type: "service" },
  { id: "thanjavur",    name: "Thanjavur",    state: "Tamil Nadu",     left: 51.51, top: 66.93, x: 324.5, y: 455.1, type: "service" },
  { id: "coimbatore",   name: "Coimbatore",   state: "Tamil Nadu",     left: 30.67, top: 69.74, x: 193.2, y: 474.2, type: "service" },
];

(function () {
  "use strict";

  const pinLayer   = document.getElementById("pinLayer");
  const routeLines = document.getElementById("routeLines");
  const section     = document.getElementById("service-areas");

  // Devices that can genuinely hover (mouse/trackpad) get CSS hover
  // tooltips for free. Touch devices rely on the tap-to-toggle logic
  // below. We still attach click handling everywhere so a desktop
  // user can also click-to-pin a tooltip open.
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- 1. Draw the radiating cold-chain route lines ---------- */
  function buildRouteLines() {
    const hub = LOCATIONS.find((loc) => loc.type === "hq");
    if (!hub || !routeLines) return;

    const frag = document.createDocumentFragment();

    LOCATIONS.forEach((loc) => {
      if (loc.type === "hq") return;
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", hub.x);
      line.setAttribute("y1", hub.y);
      line.setAttribute("x2", loc.x);
      line.setAttribute("y2", loc.y);
      line.setAttribute("class", "route-line");
      frag.appendChild(line);
    });

    routeLines.appendChild(frag);
  }

  /* ---------- 2. Build each pin + its tooltip ---------- */
  function buildPins() {
    const frag = document.createDocumentFragment();

    LOCATIONS.forEach((loc, index) => {
      const isHQ = loc.type === "hq";

      const pin = document.createElement("button");
      pin.type = "button";
      pin.className = "map-pin" + (isHQ ? " map-pin--hq" : "");
      pin.style.left = loc.left + "%";
      pin.style.top  = loc.top + "%";
      pin.style.setProperty("--delay", (index * 70) + "ms");
      pin.setAttribute("aria-describedby", "tooltip-" + loc.id);
      pin.setAttribute(
        "aria-label",
        isHQ ? "Vendum IQF Centre, Pochampalli" : loc.name + " service location"
      );

      // Keep tooltips from spilling off the edge of the map on
      // narrow screens by anchoring them left/right near the sides.
      if (loc.left < 30) pin.classList.add("tooltip-align-start");
      else if (loc.left > 65) pin.classList.add("tooltip-align-end");

      pin.innerHTML =
        '<span class="pin-pulse" aria-hidden="true"></span>' +
        '<span class="pin-dot" aria-hidden="true"></span>' +
        '<span class="map-tooltip" role="tooltip" id="tooltip-' + loc.id + '">' +
          '<strong>' + (isHQ ? "Vendum IQF Centre" : loc.name) + '</strong>' +
          (isHQ ? '<em>Pochampalli</em>' : '<em>' + loc.state + '</em>') +
        '</span>';

      pin.addEventListener("click", (e) => {
        e.stopPropagation();
        togglePin(pin);
      });

      frag.appendChild(pin);
    });

    pinLayer.appendChild(frag);
  }

  /* ---------- 3. Tooltip open/close behaviour ---------- */
  function togglePin(pin) {
    const wasActive = pin.classList.contains("is-active");
    closeAllPins();
    if (!wasActive) pin.classList.add("is-active");
  }

  function closeAllPins() {
    pinLayer.querySelectorAll(".map-pin.is-active").forEach((p) => p.classList.remove("is-active"));
  }

  // Tapping/clicking anywhere outside a pin closes any open tooltip.
  document.addEventListener("click", closeAllPins);

  // Esc closes an open tooltip too.
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAllPins();
  });

  /* ---------- 4. Staggered reveal when the section scrolls in ---------- */
  function setupReveal() {
    if (!("IntersectionObserver" in window)) {
      section.classList.add("is-visible");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            section.classList.add("is-visible");
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );
    observer.observe(section);
  }

  /* ---------- Init ---------- */
  buildRouteLines();
  buildPins();
  setupReveal();
})();
