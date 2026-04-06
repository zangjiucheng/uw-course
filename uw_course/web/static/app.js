const state = {
  terms: [],
  term: "",
  selections: [],
  searchResults: [],
  schedulePayload: { items: [], weekly: {} },
  scheduleView: "timetable",
  hoveredSectionKey: null,
  activeSectionKey: null,
  gooseCount: 0,
  timelineConfig: null,
};

const gooseImages = [
  "https://uwaterloo.ca/support/sites/default/files/styles/uw_is_media_x_large/public/uploads/images/finalist-3.png?itok=D1PdGsZQ",
  "https://uwaterloo.ca/support/sites/default/files/styles/uw_is_media_x_large/public/uploads/images/finalist-1.png?itok=EblnWhUY",
  "https://uwaterloo.ca/support/sites/default/files/styles/uw_is_media_x_large/public/uploads/images/finalist-4_0.png?itok=JOAWl5aE",
  "https://uwaterloo.ca/support/sites/default/files/styles/uw_is_media_x_large/public/uploads/images/honourable-mention-1.png?itok=xkEtLx_a",
  "https://uwaterloo.ca/support/sites/default/files/styles/uw_is_media_x_large/public/uploads/images/honourable-mention-2.png?itok=zHTAAvB_",
  "https://uwaterloo.ca/support/sites/default/files/styles/uw_is_media_x_large/public/uploads/images/honourable-mention-3.png?itok=mvNl9_NX",
  "https://uwaterloo.ca/support/sites/default/files/styles/uw_is_media_x_large/public/uploads/images/honourable-mention-4.png?itok=xeerJOPM",
];

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const dayLabels = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};
const defaultTimelineStart = 8;
const defaultTimelineEnd = 22;
const timelinePadding = 26;

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }
  return payload;
}

function showToast(message) {
  const node = document.createElement("div");
  node.className = "status-toast";
  node.textContent = message;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 2600);
}

function releaseGoose() {
  const stage = document.getElementById("goose-stage");
  const burstSize = 8 + Math.floor(Math.random() * 5);

  for (let index = 0; index < burstSize; index += 1) {
    const goose = document.createElement("img");
    const image = gooseImages[Math.floor(Math.random() * gooseImages.length)];
    const size = 72 + Math.floor(Math.random() * 48);
    const duration = 3.8 + Math.random() * 2.8;
    const delay = Math.random() * 0.9;
    const left = 4 + Math.random() * 88;

    goose.className = "goose-sprite";
    goose.src = image;
    goose.alt = "";
    goose.style.left = `${left}vw`;
    goose.style.width = `${size}px`;
    goose.style.height = `${size}px`;
    goose.style.animationDuration = `${duration}s`;
    goose.style.animationDelay = `${delay}s`;
    stage.appendChild(goose);
    setTimeout(() => goose.remove(), (duration + delay) * 1000 + 400);
  }

  state.gooseCount += burstSize;
  showToast(state.gooseCount % 16 === 0 ? "Goose storm unlocked." : "Honk. Goose rain activated.");
}

function updateTermSelect() {
  const select = document.getElementById("term-select");
  select.innerHTML = "";
  state.terms.forEach((term) => {
    const option = document.createElement("option");
    option.value = term;
    option.textContent = term;
    select.appendChild(option);
  });
  if (state.term) {
    select.value = state.term;
  }
}

function renderResults() {
  const container = document.getElementById("results");
  container.innerHTML = "";
  if (!state.searchResults.length) {
    container.className = "results empty-state";
    container.textContent = "No matching courses found.";
    return;
  }

  container.className = "results";
  const template = document.getElementById("result-card-template");
  const selectedKeys = getSelectedKeySet();

  state.searchResults.forEach((course) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.querySelector(".course-code").textContent = course.course_code;
    node.querySelector(".course-meta").textContent =
      `${course.section_count} sections · ${course.timed_section_count} with time`;
    node.querySelector(".course-description").textContent =
      course.description || "No course description is available in the database.";
    const descriptionNode = node.querySelector(".course-description");
    const toggleNode = node.querySelector(".course-description-toggle");
    node.querySelector(".course-requirements").textContent =
      course.requirements ? `Prereq: ${course.requirements}` : "";

    toggleNode.addEventListener("click", () => {
      const collapsed = descriptionNode.classList.toggle("is-collapsed");
      toggleNode.textContent = collapsed ? "Show more" : "Show less";
    });

    const sectionList = node.querySelector(".section-list");
    course.sections.forEach((section) => {
      const sectionNode = document.createElement("div");
      sectionNode.className = "section-chip";
      sectionNode.dataset.sectionKey = sectionKey(section);
      const meta = section.raw_time
        ? `${section.class_title} · ${section.raw_time} · seat ${section.available_seat ?? "?"}`
        : `${section.class_title} · no time data · seat ${section.available_seat ?? "?"}`;
      sectionNode.innerHTML = `
        <div>
          <strong>#${section.class_id}</strong>
          <p>${meta}</p>
        </div>
      `;

      const button = document.createElement("button");
      const isSelected = selectedKeys.has(sectionKey(section));
      button.textContent = isSelected ? "Remove Section" : "Add Section";
      if (isSelected) {
        button.classList.add("danger");
      }
      button.addEventListener("click", () => {
        if (selectedKeys.has(sectionKey(section))) {
          removeSelectionByKey(sectionKey(section));
          return;
        }
        addSelection(section);
      });
      sectionNode.addEventListener("mouseenter", () => setHoveredSection(section));
      sectionNode.addEventListener("mouseleave", () => setHoveredSection(null));
      sectionNode.addEventListener("click", () => setActiveSection(section));
      sectionNode.appendChild(button);
      sectionList.appendChild(sectionNode);
    });

    container.appendChild(node);

    requestAnimationFrame(() => {
      if (descriptionNode.scrollHeight <= descriptionNode.clientHeight + 2) {
        toggleNode.classList.add("hidden");
      }
    });
  });
}

function renderSelections() {
  const container = document.getElementById("selection-list");
  container.innerHTML = "";
  if (!state.selections.length) {
    container.className = "selection-list empty-state";
    container.textContent = "No sections selected yet.";
    return;
  }

  container.className = "selection-list";
  const template = document.getElementById("selection-item-template");
  state.selections.forEach((selection, index) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.dataset.sectionKey = sectionKey(selection);
    if (sectionKey(selection) === state.activeSectionKey) {
      node.classList.add("is-active");
    }
    node.querySelector(".selection-title").textContent =
      `${selection.course_code} · #${selection.class_id}`;
    node.querySelector(".selection-meta").textContent =
      `${selection.class_title || "Unknown"} · ${selection.raw_time || "no time data"}`;
    node.addEventListener("mouseenter", () => setHoveredSection(selection));
    node.addEventListener("mouseleave", () => setHoveredSection(null));
    node.addEventListener("click", () => setActiveSection(selection));
    node.querySelector(".remove-selection-button").addEventListener("click", () => {
      state.selections.splice(index, 1);
      if (sectionKey(selection) === state.activeSectionKey) {
        state.activeSectionKey = state.selections[0] ? sectionKey(state.selections[0]) : null;
      }
      renderSelections();
      refreshSchedule();
    });
    container.appendChild(node);
  });
  syncHoveredState();
}

function sectionKey(section) {
  return `${section.course_code}::${section.class_id}`;
}

function setHoveredSection(section) {
  state.hoveredSectionKey = section ? sectionKey(section) : null;
  syncHoveredState();
}

function setActiveSection(section) {
  state.activeSectionKey = section ? sectionKey(section) : null;
  renderSelections();
  renderSchedulePanel();
}

function parseClockToMinutes(rawClock) {
  if (!rawClock) {
    return null;
  }
  const [hours, minutes] = rawClock.split(":").map(Number);
  return (hours * 60) + minutes;
}

function getTimelineConfig(items) {
  const timedItems = (items || []).filter((item) => item.start_time && item.end_time);
  let startHour = defaultTimelineStart;
  let endHour = defaultTimelineEnd;

  if (timedItems.length) {
    const earliestStart = Math.min(...timedItems.map((item) => parseClockToMinutes(item.start_time)));
    const latestEnd = Math.max(...timedItems.map((item) => parseClockToMinutes(item.end_time)));

    if (earliestStart <= (defaultTimelineStart * 60)) {
      startHour = defaultTimelineStart - 1;
    }
    if (latestEnd >= (defaultTimelineEnd * 60)) {
      endHour = defaultTimelineEnd + 1;
    }
  }

  return {
    startHour,
    endHour,
    totalMinutes: (endHour - startHour) * 60,
    height: (endHour - startHour) * 60,
    hours: Array.from({ length: (endHour - startHour) + 1 }, (_, index) => startHour + index),
  };
}

function getSelectedKeySet() {
  return new Set(state.selections.map(sectionKey));
}

function computeConflictMap(items) {
  const map = new Map();
  const timed = items.filter((item) => item.days?.length && item.start_time && item.end_time);

  timed.forEach((item) => {
    item.days.forEach((day) => {
      const overlaps = timed.filter((other) => {
        if (sectionKey(other) === sectionKey(item)) {
          return false;
        }
        if (!other.days?.includes(day)) {
          return false;
        }
        const startA = parseClockToMinutes(item.start_time);
        const endA = parseClockToMinutes(item.end_time);
        const startB = parseClockToMinutes(other.start_time);
        const endB = parseClockToMinutes(other.end_time);
        return startA < endB && startB < endA;
      });
      if (overlaps.length) {
        map.set(`${sectionKey(item)}::${day}`, overlaps);
      }
    });
  });

  return map;
}

function computeConflictEntries(items) {
  const entries = [];
  weekDays.forEach((day) => {
    const dayItems = items
      .filter((item) => item.days?.includes(day) && item.start_time && item.end_time)
      .sort((left, right) => parseClockToMinutes(left.start_time) - parseClockToMinutes(right.start_time));

    for (let index = 0; index < dayItems.length; index += 1) {
      for (let inner = index + 1; inner < dayItems.length; inner += 1) {
        const first = dayItems[index];
        const second = dayItems[inner];
        if (parseClockToMinutes(second.start_time) >= parseClockToMinutes(first.end_time)) {
          break;
        }
        entries.push({
          day,
          first,
          second,
        });
      }
    }
  });
  return entries;
}

function sectionWouldConflict(section, selectedItems) {
  if (!section.start_time || !section.end_time || !section.days?.length) {
    return false;
  }
  return selectedItems.some((item) => {
    if (sectionKey(item) === sectionKey(section)) {
      return false;
    }
    if (!item.start_time || !item.end_time || !item.days?.length) {
      return false;
    }
    const sameDay = section.days.some((day) => item.days.includes(day));
    if (!sameDay) {
      return false;
    }
    const startA = parseClockToMinutes(section.start_time);
    const endA = parseClockToMinutes(section.end_time);
    const startB = parseClockToMinutes(item.start_time);
    const endB = parseClockToMinutes(item.end_time);
    return startA < endB && startB < endA;
  });
}

function getSectionConflictDetails(section, selectedItems) {
  if (!section.start_time || !section.end_time || !section.days?.length) {
    return [];
  }
  return selectedItems.filter((item) => {
    if (sectionKey(item) === sectionKey(section)) {
      return false;
    }
    if (!item.start_time || !item.end_time || !item.days?.length) {
      return false;
    }
    const sameDay = section.days.some((day) => item.days.includes(day));
    if (!sameDay) {
      return false;
    }
    const startA = parseClockToMinutes(section.start_time);
    const endA = parseClockToMinutes(section.end_time);
    const startB = parseClockToMinutes(item.start_time);
    const endB = parseClockToMinutes(item.end_time);
    return startA < endB && startB < endA;
  });
}

function getExplorerSections() {
  const sections = [];
  state.searchResults.forEach((course) => {
    course.sections.forEach((section) => {
      sections.push({
        ...section,
        description: course.description,
        requirements: course.requirements,
      });
    });
  });
  if (sections.length) {
    return sections;
  }
  return state.schedulePayload.items || [];
}

function getActiveSectionData() {
  if (!state.activeSectionKey) {
    return null;
  }
  const sections = [
    ...(state.schedulePayload.items || []),
    ...getExplorerSections(),
    ...state.selections,
  ];
  return sections.find((section) => sectionKey(section) === state.activeSectionKey) || null;
}

function getHoveredSectionData() {
  if (!state.hoveredSectionKey) {
    return null;
  }
  const sections = [
    ...(state.schedulePayload.items || []),
    ...getExplorerSections(),
    ...state.selections,
  ];
  return sections.find((section) => sectionKey(section) === state.hoveredSectionKey) || null;
}

function syncHoveredState() {
  const hoveredKey = state.hoveredSectionKey;
  document.querySelectorAll("[data-section-key]").forEach((node) => {
    node.classList.toggle("is-hovered", Boolean(hoveredKey) && node.dataset.sectionKey === hoveredKey);
  });

  const hoveredSection = getHoveredSectionData();
  const hoveredDays = new Set(hoveredSection?.days || []);
  document.querySelectorAll(".day-lane[data-day]").forEach((node) => {
    node.classList.toggle("is-hovered", hoveredDays.has(node.dataset.day));
  });

  document.querySelectorAll(".schedule-preview-block").forEach((node) => node.remove());

  if (!hoveredSection || !state.timelineConfig) {
    return;
  }

  const alreadySelected = (state.schedulePayload.items || []).some(
    (item) => sectionKey(item) === sectionKey(hoveredSection)
  );
  if (alreadySelected || !hoveredSection.start_time || !hoveredSection.end_time || !hoveredSection.days?.length) {
    return;
  }

  const start = parseClockToMinutes(hoveredSection.start_time);
  const end = parseClockToMinutes(hoveredSection.end_time);
  const top = timelinePadding + (((start - (state.timelineConfig.startHour * 60)) / state.timelineConfig.totalMinutes) * state.timelineConfig.height);
  const height = Math.max((((end - start) / state.timelineConfig.totalMinutes) * state.timelineConfig.height), 44);

  hoveredSection.days.forEach((day) => {
    const lane = document.querySelector(`.day-lane[data-day="${day}"]`);
    if (!lane) {
      return;
    }
    const preview = document.createElement("div");
    preview.className = "schedule-preview-block";
    preview.style.top = `${top}px`;
    preview.style.height = `${height}px`;
    preview.innerHTML = `
      <strong>${hoveredSection.course_code}</strong>
      <p>${hoveredSection.class_title} · #${hoveredSection.class_id}</p>
    `;
    lane.appendChild(preview);
  });
}

function renderActiveSectionPanel() {
  const panel = document.getElementById("active-section-panel");
  const activeSection = getActiveSectionData();
  if (!activeSection) {
    panel.classList.add("hidden");
    panel.innerHTML = "";
    return;
  }

  panel.classList.remove("hidden");
  panel.innerHTML = `
    <h3>${activeSection.course_code} · ${activeSection.class_title}</h3>
    <p>${activeSection.raw_time || "No time data available"}</p>
    <div class="active-section-meta">
      <span class="active-section-pill">Class #${activeSection.class_id}</span>
      <span class="active-section-pill">Seats ${activeSection.available_seat ?? "?"}</span>
      <span class="active-section-pill">${activeSection.days?.join(", ") || "Unscheduled"}</span>
    </div>
  `;
}

function renderScheduleMeta(conflicts, timedCount) {
  const statsNode = document.getElementById("schedule-stats");
  const selectedCount = state.selections.length;
  statsNode.innerHTML = `
    <span class="schedule-stat"><strong>${selectedCount}</strong> selected</span>
    <span class="schedule-stat"><strong>${timedCount}</strong> timed</span>
    <span class="${conflicts.length ? "schedule-stat schedule-stat-conflict" : "schedule-stat"}"><strong>${conflicts.length}</strong> conflicts</span>
  `;

  const conflictBar = document.getElementById("conflict-bar");
  if (!conflicts.length) {
    conflictBar.classList.add("hidden");
    conflictBar.innerHTML = "";
    return;
  }

  conflictBar.classList.remove("hidden");
  const lines = conflicts.map((entry) => (
    `<div><strong>${dayLabels[entry.day]}</strong> · ${entry.first.start_time}-${entry.first.end_time} overlaps ` +
    `${entry.first.course_code} #${entry.first.class_id} with ${entry.second.course_code} #${entry.second.class_id}</div>`
  ));
  conflictBar.innerHTML = `<div class="conflict-list">${lines.join("")}</div>`;
}

function showTimetableHoverCard(section, event) {
  const card = document.getElementById("timetable-hover-card");
  const scheduleBody = document.querySelector(".schedule-body");
  if (!card || !section || !scheduleBody || !event.currentTarget?.getBoundingClientRect) {
    return;
  }

  card.innerHTML = `
    <h3>${section.course_code} · ${section.class_title}</h3>
    <p>${section.raw_time || "No time data available"}</p>
    <div class="timetable-hover-meta">
      <span class="timetable-hover-pill">Class #${section.class_id}</span>
      <span class="timetable-hover-pill">Seats ${section.available_seat ?? "?"}</span>
    </div>
  `;

  const bodyRect = scheduleBody.getBoundingClientRect();
  const anchorRect = event.currentTarget.getBoundingClientRect();
  const cardWidth = 240;
  const cardHeight = 132;
  const gap = 10;

  let left = (anchorRect.right - bodyRect.left) + scheduleBody.scrollLeft + gap;
  let top = (anchorRect.top - bodyRect.top) + scheduleBody.scrollTop;

  if (left + cardWidth > scheduleBody.scrollLeft + bodyRect.width - 8) {
    left = (anchorRect.left - bodyRect.left) + scheduleBody.scrollLeft - cardWidth - gap;
  }
  if (top + cardHeight > scheduleBody.scrollTop + bodyRect.height - 8) {
    top = scheduleBody.scrollTop + bodyRect.height - cardHeight - 8;
  }
  if (top < scheduleBody.scrollTop + 8) {
    top = scheduleBody.scrollTop + 8;
  }
  if (left < scheduleBody.scrollLeft + 8) {
    left = scheduleBody.scrollLeft + 8;
  }

  card.style.left = `${left}px`;
  card.style.top = `${top}px`;
  card.classList.remove("hidden");
}

function hideTimetableHoverCard() {
  const card = document.getElementById("timetable-hover-card");
  if (!card) {
    return;
  }
  card.classList.add("hidden");
}

function renderTimetableView(payload, conflictMap) {
  const view = document.getElementById("timetable-view");
  const timedItems = (payload.items || []).filter((item) => item.days?.length && item.start_time && item.end_time);
  const timeline = getTimelineConfig(payload.items || []);
  state.timelineConfig = timeline;
  const visibleDays = weekDays.filter((day) => {
    if (day !== "Sat" && day !== "Sun") {
      return true;
    }
    return timedItems.some((item) => item.days.includes(day));
  });

  if (!timedItems.length) {
    hideTimetableHoverCard();
    view.innerHTML = `<div class="explorer-empty">No timed sections available for the current selection.</div>`;
    return;
  }

  const board = document.createElement("div");
  board.className = "week-shell";
  board.innerHTML = `<div class="week-board"></div>`;
  const grid = board.firstElementChild;
  grid.style.gridTemplateColumns = `72px repeat(${visibleDays.length}, minmax(118px, 1fr))`;
  grid.style.minWidth = `${72 + (visibleDays.length * 118) + (visibleDays.length * 8)}px`;

  const timeHeader = document.createElement("div");
  timeHeader.className = "time-header";
  timeHeader.textContent = "Time";
  grid.appendChild(timeHeader);

  visibleDays.forEach((day) => {
    const header = document.createElement("div");
    header.className = "day-header";
    header.innerHTML = `<strong>${day}</strong><span>${dayLabels[day]}</span>`;
    grid.appendChild(header);
  });

  const timeRail = document.createElement("div");
  timeRail.className = "time-rail";
  timeRail.style.height = `${timeline.height + (timelinePadding * 2)}px`;
  timeline.hours.forEach((hour) => {
    const marker = document.createElement("div");
    marker.className = "time-marker";
    marker.style.top = `${timelinePadding + (((hour - timeline.startHour) / (timeline.endHour - timeline.startHour)) * timeline.height)}px`;
    marker.textContent = `${String(hour).padStart(2, "0")}:00`;
    timeRail.appendChild(marker);
  });
  grid.appendChild(timeRail);

  visibleDays.forEach((day) => {
    const lane = document.createElement("div");
    lane.className = "day-lane";
    lane.dataset.day = day;
    lane.style.height = `${timeline.height + (timelinePadding * 2)}px`;
    const dayItems = timedItems.filter((item) => item.days.includes(day));

    if (!dayItems.length) {
      lane.innerHTML = `<div class="day-lane-empty">Open</div>`;
    }

    dayItems.forEach((item) => {
      const start = parseClockToMinutes(item.start_time);
      const end = parseClockToMinutes(item.end_time);
      const top = timelinePadding + (((start - (timeline.startHour * 60)) / timeline.totalMinutes) * timeline.height);
      const height = Math.max((((end - start) / timeline.totalMinutes) * timeline.height), 44);
      const block = document.createElement("div");
      block.className = "schedule-block";
      block.dataset.sectionKey = sectionKey(item);
      if (sectionKey(item) === state.hoveredSectionKey) {
        block.classList.add("is-hovered");
      }
      if (sectionKey(item) === state.activeSectionKey) {
        block.classList.add("is-active");
      }
      if (conflictMap.has(`${sectionKey(item)}::${day}`)) {
        block.classList.add("is-conflict");
      }
      block.style.top = `${top}px`;
      block.style.height = `${height}px`;
      block.innerHTML = `
        <strong>${item.course_code} · ${item.class_title}</strong>
        <p>${item.start_time} - ${item.end_time} · #${item.class_id}</p>
      `;
      block.addEventListener("mouseenter", (event) => {
        setHoveredSection(item);
        showTimetableHoverCard(item, event);
      });
      block.addEventListener("mousemove", (event) => {
        showTimetableHoverCard(item, event);
      });
      block.addEventListener("mouseleave", () => {
        setHoveredSection(null);
        hideTimetableHoverCard();
      });
      block.addEventListener("click", () => {
        setActiveSection(item);
        focusCourseInSearch(item.course_code).catch((error) => showToast(error.message));
      });
      lane.appendChild(block);
    });

    grid.appendChild(lane);
  });

  view.innerHTML = "";
  view.appendChild(board);
  syncHoveredState();
}

function renderExplorerView(conflictMap) {
  const explorer = document.getElementById("explorer-view");
  const sections = getExplorerSections();
  const selectedKeys = getSelectedKeySet();
  const selectedItems = state.schedulePayload.items || [];

  if (!sections.length) {
    explorer.innerHTML = `<div class="explorer-empty">Search for courses to explore sections here.</div>`;
    return;
  }

  const grid = document.createElement("div");
  grid.className = "explorer-grid";
  const template = document.getElementById("explorer-card-template");

  sections.forEach((section) => {
    const node = template.content.firstElementChild.cloneNode(true);
    const key = sectionKey(section);
    node.dataset.sectionKey = key;
    const isSelected = selectedKeys.has(key);
    const conflictDetails = getSectionConflictDetails(section, selectedItems);
    const hasConflict = isSelected
      ? weekDays.some((day) => conflictMap.has(`${key}::${day}`))
      : conflictDetails.length > 0;
    const badge = node.querySelector(".explorer-card-badge");
    const conflictNode = node.querySelector(".explorer-card-conflict");

    node.querySelector(".explorer-card-title").textContent =
      `${section.course_code} · ${section.class_title}`;
    node.querySelector(".explorer-card-meta").textContent =
      `#${section.class_id} · seats ${section.available_seat ?? "?"}`;
    node.querySelector(".explorer-card-time").textContent =
      section.raw_time || "No time data available";

    if (conflictDetails.length) {
      conflictNode.classList.remove("hidden");
      conflictNode.textContent = `Conflicts with ${conflictDetails.map((item) => `${item.course_code} #${item.class_id}`).join(", ")}`;
    } else {
      conflictNode.classList.add("hidden");
      conflictNode.textContent = "";
    }

    if (isSelected) {
      node.classList.add("is-selected");
      badge.classList.add("is-selected");
      badge.textContent = "Selected";
    } else if (hasConflict) {
      node.classList.add("is-conflict");
      badge.classList.add("is-conflict");
      badge.textContent = "Conflict";
    } else {
      badge.textContent = "";
    }

    if (key === state.hoveredSectionKey) {
      node.classList.add("is-hovered");
    }
    if (key === state.activeSectionKey) {
      node.classList.add("is-active");
    }

    node.addEventListener("mouseenter", () => setHoveredSection(section));
    node.addEventListener("mouseleave", () => setHoveredSection(null));
    node.addEventListener("click", () => setActiveSection(section));

    const actionHost = node.querySelector(".explorer-card-actions");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = isSelected ? "Remove from Plan" : "Add to Plan";
    button.className = isSelected ? "danger" : "";
    const handleAction = (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (isSelected) {
        removeSelectionByKey(key);
        return;
      }
      addSelection(section);
    };
    button.addEventListener("pointerdown", handleAction);
    button.addEventListener("click", (event) => {
      if (event.detail === 0) {
        handleAction(event);
      }
    });
    actionHost.appendChild(button);
    grid.appendChild(node);
  });

  explorer.innerHTML = "";
  explorer.appendChild(grid);
  syncHoveredState();
}

function updateScheduleTabs() {
  document.getElementById("tab-timetable").classList.toggle("active", state.scheduleView === "timetable");
  document.getElementById("tab-explorer").classList.toggle("active", state.scheduleView === "explorer");
  document.getElementById("timetable-view").classList.toggle("hidden", state.scheduleView !== "timetable");
  document.getElementById("explorer-view").classList.toggle("hidden", state.scheduleView !== "explorer");
}

function renderSchedulePanel() {
  const payload = state.schedulePayload;
  if (state.activeSectionKey && !(payload.items || []).some((item) => sectionKey(item) === state.activeSectionKey)) {
    state.activeSectionKey = state.selections[0] ? sectionKey(state.selections[0]) : null;
  } else if (!state.activeSectionKey && state.selections[0]) {
    state.activeSectionKey = sectionKey(state.selections[0]);
  }
  const timedCount = (payload.items || []).filter((item) => item.days?.length && item.start_time && item.end_time).length;
  const conflicts = computeConflictEntries(payload.items || []);
  const conflictMap = computeConflictMap(payload.items || []);

  renderScheduleMeta(conflicts, timedCount);
  renderActiveSectionPanel();
  renderTimetableView(payload, conflictMap);
  renderExplorerView(conflictMap);
  updateScheduleTabs();
}

function renderSchedule(payload) {
  state.schedulePayload = payload;
  renderSchedulePanel();
}

async function refreshSchedule() {
  const payload = await requestJson("/api/schedule", {
    method: "POST",
    body: JSON.stringify({
      term: state.term,
      selections: state.selections.map((item) => ({
        course_code: item.course_code,
        class_id: item.class_id,
      })),
    }),
  });
  renderSchedule(payload);
}

function addSelection(section) {
  const exists = state.selections.some((item) => item.class_id === section.class_id);
  if (exists) {
    showToast("That section is already in the plan.");
    return;
  }
  state.selections.push(section);
  state.activeSectionKey = sectionKey(section);
  renderSelections();
  renderResults();
  refreshSchedule().catch((error) => showToast(error.message));
}

function removeSelectionByKey(key) {
  const index = state.selections.findIndex((item) => sectionKey(item) === key);
  if (index < 0) {
    return;
  }
  state.selections.splice(index, 1);
  renderSelections();
  renderResults();
  refreshSchedule().catch((error) => showToast(error.message));
}

async function searchCourses() {
  const input = document.getElementById("search-input");
  const query = input.value.trim();
  if (!query) {
    showToast("Enter a course code.");
    return;
  }
  const payload = await requestJson(
    `/api/courses?term=${encodeURIComponent(state.term)}&q=${encodeURIComponent(query)}`
  );
  state.searchResults = payload.results;
  renderResults();
}

async function focusCourseInSearch(courseCode) {
  if (!courseCode || !state.term) {
    return;
  }

  const payload = await requestJson(
    `/api/courses/${encodeURIComponent(courseCode)}?term=${encodeURIComponent(state.term)}`
  );
  const sections = payload.sections || [];
  state.searchResults = [
    {
      ...payload,
      section_count: sections.length,
      timed_section_count: sections.filter((item) => item.days?.length && item.start_time).length,
    },
  ];
  document.getElementById("search-input").value = courseCode;
  renderResults();
  document.querySelector(".panel-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function importPlan() {
  const input = document.getElementById("plan-input");
  const planText = (input.value.trim() || input.placeholder.trim());
  if (!planText) {
    showToast("Paste a plan first.");
    return;
  }
  const payload = await requestJson("/api/plan/parse", {
    method: "POST",
    body: JSON.stringify({ plan_text: planText }),
  });
  state.term = payload.term;
  updateTermSelect();
  state.selections = [];
  state.activeSectionKey = null;
  let skippedCourseOnly = 0;

  for (const selection of payload.selections) {
    if (selection.class_id == null) {
      skippedCourseOnly += 1;
      continue;
    }
    const coursePayload = await requestJson(
      `/api/courses/${encodeURIComponent(selection.course_code)}?term=${encodeURIComponent(state.term)}`
    );
    const matching = coursePayload.sections.find((item) => item.class_id === selection.class_id);
    if (matching) {
      state.selections.push(matching);
    }
  }

  renderSelections();
  renderResults();
  await refreshSchedule();
  if (skippedCourseOnly > 0) {
    showToast(`Imported locked sections. ${skippedCourseOnly} course-only line(s) were skipped; use Auto Resolve Courses for those.`);
    return;
  }
  showToast("Plan imported.");
}

async function autoResolvePlan() {
  const input = document.getElementById("plan-input");
  const planText = (input.value.trim() || input.placeholder.trim());
  if (!planText) {
    showToast("Paste a plan first.");
    return;
  }

  const payload = await requestJson("/api/plan/resolve", {
    method: "POST",
    body: JSON.stringify({ plan_text: planText }),
  });

  state.term = payload.term;
  updateTermSelect();
  state.selections = payload.resolved_items || [];
  state.activeSectionKey = state.selections[0] ? sectionKey(state.selections[0]) : null;
  renderSelections();
  renderResults();
  renderSchedule(payload);

  const unresolvedCount = (payload.unresolved_courses || []).length;
  const autoResolvedCount = (payload.auto_resolved_courses || []).length;
  if (unresolvedCount > 0) {
    const summary = payload.unresolved_courses
      .slice(0, 2)
      .map((item) => `${item.course_code}`)
      .join(", ");
    showToast(`Auto-resolved ${autoResolvedCount} course(s). ${unresolvedCount} could not be resolved${summary ? `: ${summary}` : ""}.`);
    return;
  }
  showToast(`Auto-resolved ${autoResolvedCount} course(s).`);
}

async function exportPlan() {
  const payload = await requestJson("/api/plan/export", {
    method: "POST",
    body: JSON.stringify({
      term: state.term,
      selections: state.selections.map((item) => ({
        course_code: item.course_code,
        class_id: item.class_id,
      })),
    }),
  });
  await navigator.clipboard.writeText(payload.plan_text);
  showToast("Plan text copied to the clipboard.");
}

async function bootstrap() {
  const termsPayload = await requestJson("/api/terms");
  state.terms = termsPayload.terms;
  state.term = state.terms[0] || "";
  updateTermSelect();

  document.getElementById("term-select").addEventListener("change", (event) => {
    state.term = event.target.value;
    state.searchResults = [];
    renderResults();
    refreshSchedule().catch((error) => showToast(error.message));
  });
  document.getElementById("search-button").addEventListener("click", () => {
    searchCourses().catch((error) => showToast(error.message));
  });
  document.getElementById("search-input").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      searchCourses().catch((error) => showToast(error.message));
    }
  });
  document.getElementById("import-plan-button").addEventListener("click", () => {
    importPlan().catch((error) => showToast(error.message));
  });
  document.getElementById("auto-resolve-button").addEventListener("click", () => {
    autoResolvePlan().catch((error) => showToast(error.message));
  });
  document.getElementById("export-plan-button").addEventListener("click", () => {
    exportPlan().catch((error) => showToast(error.message));
  });
  document.getElementById("goose-button").addEventListener("click", releaseGoose);
  document.getElementById("tab-timetable").addEventListener("click", () => {
    state.scheduleView = "timetable";
    updateScheduleTabs();
  });
  document.getElementById("tab-explorer").addEventListener("click", () => {
    state.scheduleView = "explorer";
    updateScheduleTabs();
  });

  renderResults();
  renderSelections();
  await refreshSchedule();
}

bootstrap().catch((error) => showToast(error.message));
