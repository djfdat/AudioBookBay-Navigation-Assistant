/* Shared by the Firefox content scripts and the dependency-free filter tests. */
const ABBNAFilters = (() => {
  const listKeys = ["categories", "keywords", "authors", "languages", "formats"];
  const rangeKeys = ["bitrate", "size", "dates"];
  const normalize = (value) => String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase();

  function defaults() {
    return {
      version: 1,
      ...Object.fromEntries(listKeys.map((key) => [key, { enabled: false, items: [] }])),
      bitrate: { enabled: false, min: 128, max: 320, allowUnknown: true },
      size: { enabled: false, min: 10, max: 1000, allowUnknown: true },
      dates: { enabled: false, min: "", max: "" },
      navigation: { skipEmpty: true, nextAtEnd: true },
    };
  }

  // Read only recognized fields; partial or damaged saved data cannot break startup.
  function restore(saved) {
    const settings = defaults();
    if (!saved || saved.version !== 1) return settings;
    for (const key of listKeys) {
      const group = saved[key];
      if (!group || typeof group.enabled !== "boolean" || !Array.isArray(group.items)) continue;
      const seen = new Set();
      settings[key] = {
        enabled: group.enabled,
        items: group.items.filter((item) => {
          if (typeof item?.value !== "string" || typeof item.enabled !== "boolean") return false;
          const value = normalize(item.value);
          if (!value || seen.has(value)) return false;
          seen.add(value);
          return true;
        }).map((item) => ({ value: item.value.trim(), enabled: item.enabled })),
      };
    }
    for (const key of rangeKeys) {
      const group = saved[key];
      if (!group || typeof group.enabled !== "boolean") continue;
      const candidate = { ...settings[key], enabled: group.enabled, min: group.min, max: group.max };
      if (key !== "dates" && typeof group.allowUnknown === "boolean") candidate.allowUnknown = group.allowUnknown;
      const check = { ...defaults(), [key]: candidate };
      if (!Object.keys(validate(check)).length) settings[key] = candidate;
    }
    for (const key of ["skipEmpty", "nextAtEnd"]) {
      if (typeof saved.navigation?.[key] === "boolean") settings.navigation[key] = saved.navigation[key];
    }
    return settings;
  }

  function validDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }

  function validate(settings) {
    const errors = {};
    for (const key of listKeys) {
      const seen = new Set();
      settings[key].items.forEach((item, index) => {
        const value = normalize(item.value);
        if (!value) errors[`${key}.${index}`] = "Enter a value or remove this item.";
        else if (seen.has(value)) errors[`${key}.${index}`] = "This value is already in the list.";
        seen.add(value);
      });
    }
    for (const key of rangeKeys) {
      const { min, max } = settings[key];
      for (const bound of ["min", "max"]) {
        const value = settings[key][bound];
        if (value === "") continue;
        if (key === "dates" ? !validDate(value) : typeof value !== "number" || !Number.isFinite(value) || value < 0) {
          errors[`${key}.${bound}`] = key === "dates" ? "Enter a valid date." : "Enter a number of zero or greater.";
        }
      }
      if (min !== "" && max !== "" && min > max) errors[`${key}.max`] = "The upper bound must be at least the lower bound.";
    }
    return errors;
  }

  function field(text, label) {
    const labels = "Category|Language|Keywords|Posted|Format|Bitrate|File Size|Author|Written by";
    const match = text.match(new RegExp(`(?:${label}):\\s*([\\s\\S]*?)(?=(?:${labels}):|$)`, "i"));
    return match ? match[1].replace(/\s*\/\s*$/, "").trim() : "";
  }

  function splitValues(text) {
    // Keep ordinary spaces in multiword categories and author names.
    return text.split(/\u00a0+|\n+|\s*[,;|]\s*/).map((value) => value.trim()).filter(Boolean);
  }

  function parseDate(text) {
    if (validDate(text)) return text;
    const match = text.trim().match(/^(\d{1,2})\s+([a-z]{3,9})\s+(\d{4})$/i);
    if (!match) return null;
    const month = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].indexOf(match[2].slice(0, 3).toLowerCase()) + 1;
    const value = `${match[3]}-${String(month).padStart(2, "0")}-${match[1].padStart(2, "0")}`;
    return validDate(value) ? value : null;
  }

  function parseSize(text) {
    const match = text.trim().match(/^([\d,]+(?:\.\d+)?)\s*(B|KB|MB|GB|TB|KiB|MiB|GiB|TiB)s?\.?$/i);
    if (!match) return null;
    const units = { b: 1, kb: 1e3, mb: 1e6, gb: 1e9, tb: 1e12, kib: 1024, mib: 1024 ** 2, gib: 1024 ** 3, tib: 1024 ** 4 };
    const value = Number(match[1].replaceAll(",", "")) * units[match[2].toLowerCase()] / 1e6;
    return Number.isFinite(value) ? value : null;
  }

  function parseMetadata({ title = "", info = "", content = "", authors = "" }) {
    // Listing titles use "Book title - Author". Never treat "Shared by" as the author.
    const authorText = authors || field(content, "Author|Written by") || (title.includes(" - ") ? title.slice(title.lastIndexOf(" - ") + 3) : "");
    const bitrateText = field(content, "Bitrate");
    const bitrateMatch = bitrateText.match(/^(\d+(?:\.\d+)?)\s*(?:Kbps|kb\/s)?$/i);
    return {
      categories: splitValues(field(info, "Category")),
      keywords: field(info, "Keywords"),
      authors: splitValues(authorText),
      languages: splitValues(field(info, "Language")),
      formats: splitValues(field(content, "Format").replace(/\s*\/\s*/g, ";")),
      bitrate: bitrateMatch ? Number(bitrateMatch[1]) : null,
      size: parseSize(field(content, "File Size")),
      dates: parseDate(field(content, "Posted")),
    };
  }

  function matches(metadata, settings) {
    for (const key of listKeys) {
      const group = settings[key];
      const values = group.items.filter((item) => item.enabled).map((item) => normalize(item.value));
      if (!group.enabled || !values.length) continue;
      const found = key === "keywords"
        ? values.some((value) => normalize(metadata.keywords).includes(value))
        : values.some((value) => (metadata[key] || []).some((item) => normalize(item) === value));
      if (["languages", "formats"].includes(key) ? !found : found) return false;
    }
    for (const key of rangeKeys) {
      const group = settings[key];
      if (!group.enabled) continue;
      const value = metadata[key];
      if (value == null) {
        if (key !== "dates" && !group.allowUnknown) return false;
      } else if ((group.min !== "" && value < group.min) || (group.max !== "" && value > group.max)) return false;
    }
    return true;
  }

  return { defaults, restore, validate, parseMetadata, matches, listKeys, rangeKeys };
})();

if (typeof module !== "undefined") module.exports = ABBNAFilters;
