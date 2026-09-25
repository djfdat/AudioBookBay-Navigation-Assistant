/* Firefox content-script entry point. */
(async () => {
  const storageKey = "abbnaSettings";
  let settings = ABBNAFilters.defaults();
  let warning = "";
  try {
    const stored = await browser.storage.local.get(storageKey);
    settings = ABBNAFilters.restore(stored[storageKey]);
  } catch {
    warning = "Saved settings could not be loaded. Filters are off until settings can be saved again.";
  }

  const navigation = [...document.querySelectorAll(".wp-pagenavi > a")];
  const previousPage = navigation.find((link) => link.textContent.trim() === "«");
  const nextPage = navigation.find((link) => link.textContent.trim() === "»");
  const text = (node) => {
    if (!node) return "";
    // textContent drops <br> boundaries; preserve them without reading layout.
    if (node.nodeType === Node.TEXT_NODE) return node.textContent;
    if (node.nodeName === "BR") return "\n";
    return [...node.childNodes].map(text).join("");
  };
  const allEntries = [...document.querySelectorAll("#content > .post")].map((element) => ({
    element,
    originalDisplay: element.style.getPropertyValue("display"),
    originalPriority: element.style.getPropertyPriority("display"),
    filtered: false,
    metadata: ABBNAFilters.parseMetadata({
      title: text(element.querySelector(":scope > .postTitle")),
      info: text(element.querySelector(":scope > .postInfo")),
      content: text(element.querySelector(":scope > .postContent > p:last-child")),
    }),
  }));
  let entries = [];
  let selected = null;
  const ui = ABBNASettings.create({
    getSettings: () => settings,
    warning,
    async save(nextSettings) {
      await browser.storage.local.set({ [storageKey]: nextSettings });
      settings = nextSettings;
      applyFilters();
    },
  });

  function applyFilters() {
    entries = [];
    for (const entry of allEntries) {
      const visible = ABBNAFilters.matches(entry.metadata, settings);
      if (visible) {
        if (entry.filtered) {
          if (entry.originalDisplay) entry.element.style.setProperty("display", entry.originalDisplay, entry.originalPriority);
          else entry.element.style.removeProperty("display");
        }
        entries.push(entry.element);
      } else entry.element.style.setProperty("display", "none", "important");
      entry.filtered = !visible;
    }
    if (!entries.includes(selected)) selected = entries[0] || null;
    ui.update(entries.length, allEntries.length);
    // Detail pages and genuinely empty listings must not trigger automatic navigation.
    if (allEntries.length && !entries.length && settings.navigation.skipEmpty) nextPage?.click();
  }

  document.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || ui.isOpen()) return;
    if (event.composedPath().some((node) => node instanceof Element && (
      node === ui.host || node.matches("input, textarea, select, button, [role=textbox], [role=combobox], [role=slider]") || node.isContentEditable
    ))) return;
    if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
    // Leave reading/detail pages to the browser.
    if (!allEntries.length) return;
    event.preventDefault();
    if (event.key === "ArrowLeft") return previousPage?.click();
    if (event.key === "ArrowRight") return nextPage?.click();
    if (!entries.length) return;
    const index = entries.indexOf(selected);
    if (event.key === "ArrowDown" && index === entries.length - 1) {
      if (settings.navigation.nextAtEnd) nextPage?.click();
      return;
    }
    selected = entries[Math.max(0, index + (event.key === "ArrowDown" ? 1 : -1))];
    selected.scrollIntoView({ block: "start" });
  });
  applyFilters();
})();
