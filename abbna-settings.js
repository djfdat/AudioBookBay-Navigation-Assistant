const ABBNASettings = (() => {
  const labels = {
    categories: ["Categories", "Exclude entries in these categories.", "Category"],
    keywords: ["Keywords", "Exclude entries containing these keywords.", "Keyword"],
    authors: ["Authors", "Exclude entries by these authors.", "Author"],
    languages: ["Languages", "Allow only these languages. An empty list allows all.", "Language"],
    formats: ["Formats", "Allow only these formats. An empty list allows all.", "Format"],
    bitrate: ["Bitrate", "Inclusive range in Kbps. Blank means no limit."],
    size: ["File size", "Inclusive range in MB. Blank means no limit."],
    dates: ["Dates", "Inclusive posting dates. Unknown dates are allowed."],
  };

  function create({ getSettings, save, warning = "" }) {
    const host = document.createElement("div");
    host.id = "abbna-settings";
    host.style.setProperty("all", "initial", "important");
    const root = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = `
      /* Palette from AudioBookBay's simplebalance theme. */
      :host {
        all: initial; color-scheme: light;
        --abb-accent: #207f7b;
        --abb-accent-hover: #196561;
        --abb-red: #d90202;
        --abb-surface: #fff;
        --abb-tint: #eff7f7;
        --abb-border: #92bdbb;
        --abb-divider: #d2ebea;
        --abb-text: #333;
        --abb-muted: #666;
      }
      *, *::before, *::after { box-sizing: border-box; }
      button, input { font: inherit; }
      button { cursor: pointer; }
      button, input { accent-color: var(--abb-accent); }
      button:focus-visible, input:focus-visible, summary:focus-visible {
        outline: 2px solid var(--abb-accent); outline-offset: 3px;
      }
      .gear { position: fixed; top: 12px; left: 12px; z-index: 2147483647;
        display: grid; place-items: center; width: 44px; height: 44px;
        border: 1px solid var(--abb-border); border-radius: 50%; background: var(--abb-surface);
        color: var(--abb-accent); box-shadow: 0 2px 10px #207f7b18; }
      .gear:hover { background: var(--abb-tint); }
      .panel { position: fixed; inset: 12px auto auto 68px; margin: 0;
        width: 380px; max-width: calc(100vw - 80px); max-height: calc(100dvh - 24px);
        padding: 0; overflow: auto; overscroll-behavior: contain;
        border: 1px solid var(--abb-border); border-radius: 14px; background: var(--abb-surface);
        color: var(--abb-text); box-shadow: 0 12px 48px #173c3a26;
        font: 14px/1.5 system-ui, sans-serif; text-align: left; }
      .panel::backdrop { background: #173c3a26; }
      header { padding: 22px 22px 16px; background: var(--abb-tint); border-bottom: 1px solid var(--abb-divider); }
      h2 { color: var(--abb-red); margin: 0 0 4px; font-size: 19px; font-weight: 650; letter-spacing: -.4px; }
      p { margin: 0; }
      .muted, .hint, .count { color: var(--abb-muted); font-size: 12px; }
      .count { margin-top: 8px; }
      fieldset { padding: 0; margin: 0; min-width: 0; border: 0; }
      .sections { padding: 0 22px; }
      details { border-top: 1px solid var(--abb-divider); }
      .sections > details:first-child { border-top: 0; }
      summary { display: flex; align-items: center; gap: 10px; cursor: pointer;
        user-select: none;
        min-height: 48px; padding: 10px 0; font-weight: 600; list-style: none; }
      summary::-webkit-details-marker { display: none; }
      summary::before { content: '+'; width: 12px; color: var(--abb-muted); font-weight: 400; }
      details[open] > summary::before { content: '−'; }
      .badge { margin-left: auto; font-size: 11px; font-weight: 500; color: var(--abb-muted); }
      .badge { text-align: right; }
      .context { font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
      details[open] > summary .context { display: none; }
      .badge.on { color: var(--abb-accent); }
      .body { padding: 0 0 18px; }
      .check { display: flex; align-items: center; gap: 8px; min-height: 36px; cursor: pointer; }
      input[type=checkbox] { width: 17px; height: 17px; flex: 0 0 17px; margin: 0; }
      .hint { margin: 5px 0 10px; }
      .row { display: grid; grid-template-columns: 24px minmax(0, 1fr) 32px;
        gap: 6px; align-items: center; margin-top: 8px; }
      input[type=text], input[type=number], input[type=date] {
        width: 100%; min-width: 0; height: 36px; padding: 6px 9px; border: 1px solid var(--abb-border);
        border-radius: 6px; background: var(--abb-surface); color: var(--abb-text); }
      input[aria-invalid=true] { border-color: var(--abb-red); }
      .remove { width: 32px; height: 36px; border: 0; background: transparent; color: var(--abb-muted); font-size: 20px; }
      .remove:hover { color: var(--abb-red); background: #fff1ef; border-radius: 6px; }
      .add { margin-top: 10px; padding: 5px 0; border: 0; background: transparent; color: var(--abb-accent); font-weight: 600; }
      .bounds { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 12px; margin: 12px 0; }
      .bounds label { display: block; font-size: 12px; }
      .bounds input { display: block; margin-top: 5px; }
      .error { color: var(--abb-red); font-size: 12px; margin-top: 5px; }
      .error:empty { display: none; }
      .row .error { grid-column: 2 / -1; margin: 0; }
      .notice { margin: 0 22px 12px; color: var(--abb-red); font-size: 12px; }
      footer { position: sticky; bottom: 0; padding: 14px 22px; background: var(--abb-tint);
        border-top: 1px solid var(--abb-divider); display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }
      footer .error { flex-basis: 100%; margin: 0 0 4px; }
      footer button { min-height: 38px; padding: 7px 16px; border-radius: 7px; font-weight: 600; }
      .cancel { border: 1px solid var(--abb-border); color: var(--abb-text); background: var(--abb-surface); }
      .apply { border: 1px solid var(--abb-accent); color: #fff; background: var(--abb-accent); }
      .apply:hover:not(:disabled) { background: var(--abb-accent-hover); border-color: var(--abb-accent-hover); }
      .cancel:hover:not(:disabled) { background: var(--abb-tint); border-color: var(--abb-accent); }
      .add:hover, .empty button:hover { color: var(--abb-red); }
      button:disabled { opacity: .6; cursor: wait; }
      .empty { position: fixed; bottom: 16px; left: 16px; z-index: 2147483646;
        max-width: calc(100vw - 32px); padding: 12px 16px; border: 1px solid var(--abb-border);
        border-radius: 10px; background: var(--abb-surface); color: var(--abb-text);
        box-shadow: 0 2px 12px #207f7b18; font: 14px/1.5 system-ui, sans-serif; }
      .empty button { margin-left: 8px; padding: 4px; border: 0; color: var(--abb-accent); background: transparent; text-decoration: underline; }
      [hidden] { display: none !important; }
      @media (max-width: 480px) {
        .panel { inset: 64px 12px auto 12px; width: auto; max-width: none; max-height: calc(100dvh - 76px); }
      }
    `;
    root.append(style);
    function element(tag, attributes = {}, text) {
      const node = document.createElement(tag);
      for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
      if (text !== undefined) node.textContent = text;
      return node;
    }
    const gear = element("button", { type: "button", class: "gear", "aria-label": "Open AudioBookBay settings", "aria-haspopup": "dialog", "aria-expanded": "false", title: "AudioBookBay Navigation Assistant settings" });
    // Static icon only; all editable and page-provided text uses textContent/value.
    const gearIcon = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9.5 3-.6 2.1-1.8 1L5 5.6 2.5 10l1.5 1.6v2L2.5 15 5 19.4l2.1-.5 1.8 1 .6 2.1h5l.6-2.1 1.8-1 2.1.5 2.5-4.4-1.5-1.4v-2L21.5 10 19 5.6l-2.1.5-1.8-1L14.5 3z"/><circle cx="12" cy="12.5" r="3.3"/></svg>';
    const closeIcon = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';
    gear.innerHTML = gearIcon;
    const panel = element("dialog", { id: "settings-panel", class: "panel", "aria-labelledby": "settings-title" });
    gear.setAttribute("aria-controls", panel.id);
    gear.addEventListener("click", () => panel.open ? panel.close() : openSettings());
    const empty = element("div", { class: "empty", hidden: "", role: "status" });
    empty.append(element("span", {}, "No entries match your filters."));
    const adjust = element("button", { type: "button" }, "Adjust settings");
    adjust.addEventListener("click", () => openSettings());
    empty.append(adjust);
    root.append(gear, panel, empty);
    document.body.append(host);

    let draft;
    let form;
    let saveError;
    let saving = false;
    const fields = new Map();

    function filterCountLabel() {
      const count = Object.keys(labels).filter((key) => draft[key].enabled).length;
      return `${count} filter ${count === 1 ? "type" : "types"} enabled`;
    }

    function filterSummary(key, group) {
      if (group.items) return `${group.items.filter((item) => item.enabled).length}/${group.items.length}`;
      const { min, max } = group;
      const errors = ABBNAFilters.validate({ ...ABBNAFilters.defaults(), [key]: group });
      if (Object.keys(errors).length) return "Check range";
      const format = (value) => key === "dates"
        ? new Intl.DateTimeFormat(undefined, { year: "2-digit", month: "numeric", day: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`))
        : String(value);
      const units = key === "bitrate" ? " Kbps" : key === "size" ? " MB" : "";
      if (min === "" && max === "") return key === "dates" ? "Any date" : key === "bitrate" ? "Any bitrate" : "Any size";
      if (min === "") return `≤ ${format(max)}${units}`;
      if (max === "") return `≥ ${format(min)}${units}`;
      return `${format(min)}${min === max ? "" : `–${format(max)}`}${units}`;
    }

    function checkbox(text, value, onChange) {
      const label = element("label", { class: "check" });
      const input = element("input", { type: "checkbox" });
      input.checked = value;
      input.addEventListener("change", () => onChange(input.checked));
      label.append(input, document.createTextNode(text));
      return label;
    }

    function register(input, path, container) {
      const error = element("p", { class: "error", id: `error-${path.replaceAll(".", "-")}` });
      input.setAttribute("aria-describedby", error.id);
      container.append(error);
      fields.set(path, { input, error });
      input.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" || event.isComposing || event.keyCode === 229) return;
        event.preventDefault();
        event.stopPropagation();
        const errors = ABBNAFilters.validate(draft);
        const groupPrefix = `${path.split(".")[0]}.`;
        let firstInvalid;
        for (const [fieldPath, field] of fields) {
          if (!fieldPath.startsWith(groupPrefix)) continue;
          field.error.textContent = errors[fieldPath] || "";
          field.input.setAttribute("aria-invalid", String(Boolean(errors[fieldPath])));
          if (errors[fieldPath] && !firstInvalid) firstInvalid = field.input;
        }
        // Values already belong to the draft via input events. Enter completes
        // this edit without submitting the form or changing the applied filters.
        if (firstInvalid) firstInvalid.focus();
        else input.blur();
      });
    }

    function render() {
      fields.clear();
      panel.replaceChildren();
      // Include age and category modifiers from the same sidebar taxonomy.
      // The datalist must share the input's shadow root to resolve its list attribute.
      const categorySuggestions = element("datalist", { id: "abbna-category-suggestions" });
      const categories = new Map();
      for (const link of document.querySelectorAll('#lsidebar a[href*="/audio-books/type/"]')) {
        const value = link.textContent.trim().replace(/\s+/g, " ");
        if (value && !categories.has(value.toLowerCase())) categories.set(value.toLowerCase(), value);
      }
      for (const value of [...categories.values()].sort((a, b) => a.localeCompare(b))) {
        categorySuggestions.append(element("option", { value }));
      }
      panel.append(categorySuggestions);
      const header = element("header");
      header.append(element("h2", { id: "settings-title" }, "Settings"), element("p", { class: "muted" }, "AudioBookBay Navigation Assistant Settings"), element("p", { class: "count", role: "status" }, filterCountLabel()));
      panel.append(header);
      if (warning) panel.append(element("p", { class: "notice", role: "status" }, warning));
      form = element("form", { novalidate: "" });
      const fieldset = element("fieldset");
      const sections = element("div", { class: "sections" });
      fieldset.append(sections);
      form.append(fieldset);
      panel.append(form);

      for (const [key, [title, hint, singular]] of Object.entries(labels)) {
        const group = draft[key];
        const details = element("details");
        const summary = element("summary", {}, title);
        const badge = element("span", { class: "badge" });
        const status = element("span");
        const context = element("span", { class: "context" });
        badge.append(status, context);
        const updateBadge = () => {
          status.textContent = group.enabled ? "On" : "Off";
          badge.classList.toggle("on", group.enabled);
          context.hidden = !group.enabled;
          context.textContent = group.enabled ? ` · ${filterSummary(key, group)}` : "";
          if (key === "bitrate" || key === "size") {
            context.title = `Unknown ${title.toLowerCase()} ${group.allowUnknown ? "allowed" : "excluded"}`;
          }
        };
        updateBadge();
        details.addEventListener("input", updateBadge);
        details.addEventListener("change", updateBadge);
        summary.append(badge);
        const body = element("div", { class: "body" });
        body.append(checkbox(`Enable ${title.toLowerCase()} filter`, group.enabled, (checked) => {
          group.enabled = checked;
          panel.querySelector(".count").textContent = filterCountLabel();
          updateBadge();
        }), element("p", { class: "hint" }, hint));
        details.append(summary, body);
        sections.append(details);

        if (singular) {
          const list = element("div");
          const renderRows = () => {
            for (const path of fields.keys()) if (path.startsWith(`${key}.`)) fields.delete(path);
            list.replaceChildren();
            group.items.forEach((item, index) => {
              const row = element("div", { class: "row" });
              const toggle = element("input", { type: "checkbox", "aria-label": `Enable ${singular.toLowerCase()} ${index + 1}` });
              toggle.checked = item.enabled;
              toggle.addEventListener("change", () => { item.enabled = toggle.checked; });
              const input = element("input", { type: "text", "aria-label": `${singular} ${index + 1}`, autocomplete: "off", spellcheck: "false" });
              if (key === "categories") input.setAttribute("list", categorySuggestions.id);
              input.value = item.value;
              input.addEventListener("input", () => { item.value = input.value; });
              const remove = element("button", { type: "button", class: "remove", "aria-label": `Remove ${singular.toLowerCase()} ${index + 1}` }, "×");
              remove.addEventListener("click", () => {
                group.items.splice(index, 1);
                renderRows();
                (list.querySelectorAll('input[type=text]')[Math.min(index, group.items.length - 1)] || add).focus();
              });
              row.append(toggle, input, remove);
              register(input, `${key}.${index}`, row);
              list.append(row);
            });
            updateBadge();
          };
          const add = element("button", { type: "button", class: "add" }, `+ Add ${singular.toLowerCase()}`);
          add.addEventListener("click", () => {
            group.items.push({ value: "", enabled: true });
            renderRows();
            list.lastElementChild.querySelector('input[type=text]').focus();
          });
          renderRows();
          body.append(list, add);
        } else {
          const bounds = element("div", { class: "bounds" });
          for (const bound of ["min", "max"]) {
            const caption = key === "dates" ? (bound === "min" ? "From" : "Through") : `${bound === "min" ? "Minimum" : "Maximum"} (${key === "size" ? "MB" : "Kbps"})`;
            const label = element("label", {}, caption);
            const input = element("input", { type: key === "dates" ? "date" : "number", "aria-label": `${title}: ${caption}` });
            if (key !== "dates") { input.min = "0"; input.step = "any"; input.placeholder = "No limit"; }
            input.value = group[bound];
            input.addEventListener("input", () => {
              group[bound] = input.validity.badInput ? NaN : input.value === "" || key === "dates" ? input.value : input.valueAsNumber;
            });
            label.append(input);
            register(input, `${key}.${bound}`, label);
            bounds.append(label);
          }
          body.append(bounds);
          if (key !== "dates") body.append(checkbox(`Allow unknown ${title.toLowerCase()}`, group.allowUnknown, (checked) => { group.allowUnknown = checked; }));
        }
      }
      const navigation = element("details", { open: "" });
      const navigationBody = element("div", { class: "body" });
      navigationBody.append(
        checkbox("Skip pages with no matching entries", draft.navigation.skipEmpty, (checked) => { draft.navigation.skipEmpty = checked; }),
        checkbox("Go to the next page after the last entry", draft.navigation.nextAtEnd, (checked) => { draft.navigation.nextAtEnd = checked; }),
        element("p", { class: "hint" }, "Arrow keys navigate entries and pages outside editable controls. Applying filters can skip to the next page."),
      );
      navigation.append(element("summary", {}, "Navigation"), navigationBody);
      sections.prepend(navigation);
      const footer = element("footer");
      saveError = element("p", { class: "error", role: "alert" });
      const cancel = element("button", { type: "button", class: "cancel" }, "Cancel");
      cancel.addEventListener("click", () => panel.close());
      const apply = element("button", { type: "submit", class: "apply" }, "Apply");
      footer.append(saveError, cancel, apply);
      fieldset.append(footer);
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (saving) return;
        const errors = ABBNAFilters.validate(draft);
        for (const [path, { input, error }] of fields) {
          error.textContent = errors[path] || "";
          input.setAttribute("aria-invalid", String(Boolean(errors[path])));
          if (errors[path]) input.closest("details").open = true;
        }
        const firstError = Object.keys(errors)[0];
        if (firstError) {
          saveError.textContent = "Check the highlighted fields.";
          fields.get(firstError).input.focus();
          return;
        }
        saveError.textContent = "";
        saving = true;
        fieldset.disabled = true;
        apply.textContent = "Saving…";
        form.setAttribute("aria-busy", "true");
        try {
          await save(ABBNAFilters.restore(draft));
          warning = "";
          panel.close();
        } catch {
          if (!panel.open) openSettings(true);
          saveError.textContent = "Settings could not be saved. Your edits are still here. Try Apply again.";
        } finally {
          saving = false;
          fieldset.disabled = false;
          apply.textContent = "Apply";
          form.removeAttribute("aria-busy");
        }
      });
    }

    function openSettings(keepDraft = false) {
      if (panel.open) return;
      if (!keepDraft && !saving) {
        draft = structuredClone(getSettings());
        render();
      }
      // Keep the close control inside the modal's interactive subtree and top layer.
      panel.prepend(gear);
      gear.innerHTML = closeIcon;
      gear.setAttribute("aria-label", "Close settings");
      gear.setAttribute("aria-expanded", "true");
      gear.removeAttribute("title");
      gear.removeAttribute("aria-haspopup");
      panel.showModal();
    }

    panel.addEventListener("close", () => {
      if (panel.open) return;
      root.append(gear);
      gear.innerHTML = gearIcon;
      gear.setAttribute("aria-label", "Open AudioBookBay settings");
      gear.setAttribute("aria-expanded", "false");
      gear.setAttribute("aria-haspopup", "dialog");
      gear.setAttribute("title", "AudioBookBay Navigation Assistant settings");
      gear.focus();
    });
    // The native dialog makes the page inert. Backdrop clicks target the dialog;
    // close only after a complete outside click, never on pointerdown (which
    // would let the ensuing click reach the page) or a drag out of a control.
    const isOutside = (event) => {
      const bounds = panel.getBoundingClientRect();
      return event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom;
    };
    let startedOutside = false;
    panel.addEventListener("pointerdown", (event) => {
      startedOutside = event.target === panel && isOutside(event);
      event.stopPropagation();
    });
    panel.addEventListener("click", (event) => {
      event.stopPropagation();
      if (startedOutside && event.target === panel && isOutside(event)) {
        event.preventDefault();
        panel.close();
      }
      startedOutside = false;
    });
    return {
      host,
      isOpen: () => panel.open,
      update(visible, total) {
        empty.hidden = !total || visible > 0;
      },
    };
  }
  return { create };
})();
