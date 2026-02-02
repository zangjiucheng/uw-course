import subprocess

from textual import on
from textual.app import App, ComposeResult
from textual.containers import Horizontal, Vertical
from textual.widgets import (
    Button,
    Checkbox,
    Footer,
    Header,
    Input,
    Select,
    Static,
    TabbedContent,
    TabPane,
)

from uw_course.ClassSchedule.runner import SearchAvalibleInTerm, get_course_detail, makeSchedule
from uw_course.DB.dbClass import dbClass
from uw_course.setting import Setting


def _collection_options():
    options = [("Select term...", "")]
    for year in (2025, 2026):
        for term in ("Winter", "Spring", "Fall"):
            value = f"Class{year}{term}"
            label = f"{year} {term}"
            options.append((label, value))
    return options


def _parse_collection_file(path, db):
    course_wish_list = []
    with open(path, "r") as handle:
        collection = handle.readline().strip().split("#")[0].strip()
        next(handle, None)
        for line in handle:
            if line.startswith("#") or not line.strip():
                continue
            info = line.strip().split(",")
            course = info[0].strip()
            if len(info) > 1 and info[1].strip():
                course_wish_list.append(
                    SearchAvalibleInTerm(db, course, int(info[1].strip()), quiet=True)
                )
            else:
                course_wish_list.append(SearchAvalibleInTerm(db, course, quiet=True))
    return collection, [c for c in course_wish_list if c is not None]


class CourseApp(App):
    BINDINGS = [
        ("j", "focus_next", "Next"),
        ("k", "focus_previous", "Previous"),
        ("h", "focus_left", "Left"),
        ("l", "focus_right", "Right"),
        ("q", "app.quit", "Quit"),
    ]

    CSS = """
    #app-body { padding: 1; }
    #actions { height: auto; }
    #form { height: 1fr; overflow-y: auto; }
    #output { height: 1fr; border: round $accent; padding: 1; }
    #status { height: auto; color: $text-muted; }
    #schedule-list { height: auto; border: round $accent; padding: 1; }
    #schedule-tabs { height: auto; }
    #manual-pane, #load-pane { height: auto; }
    """

    def __init__(self):
        super().__init__()
        self.db = dbClass()
        self.setting = Setting()
        self.schedule_entries = []

    def compose(self) -> ComposeResult:
        yield Header()
        with Vertical(id="app-body"):
            with Horizontal(id="actions"):
                yield Button("Check Detail", id="action-detail")
                yield Button("Build Schedule", id="action-schedule")
                yield Button("Export PDF", id="action-export")
                yield Button("Quit", id="action-quit", variant="error")
            yield Static("Choose an action to begin.", id="status")
            yield Vertical(id="form")
            yield Static("", id="output")
        yield Footer()

    def _set_status(self, message):
        self.query_one("#status", Static).update(message)

    def _set_output(self, message):
        output = self.query_one("#output", Static)
        output.update(message)
        output.display = bool(message)

    def _reset_form(self):
        form = self.query_one("#form", Vertical)
        form.remove_children()
        self._set_output("")

    def _update_schedule_preview(self):
        preview = ["Schedule entries:"]
        for entry in self.schedule_entries:
            if entry.get("class_id") is not None:
                preview.append(f"- {entry['course']} ({entry['class_id']})")
            else:
                preview.append(f"- {entry['course']}")
        message = "\n".join(preview) if len(preview) > 1 else "No entries yet."
        if self.query("#schedule-list"):
            self.query_one("#schedule-list", Static).update(message)

    def on_button_pressed(self, event):
        button_id = event.button.id
        if button_id is None or not button_id.startswith("action-"):
            return
        if button_id == "action-quit":
            self.exit()
            return

        self._reset_form()
        self._set_output("")

        if button_id == "action-detail":
            form = self.query_one("#form", Vertical)
            form.mount(Input(placeholder="Course code (e.g., CS 136)", id="detail-input"))
            form.mount(Button("Lookup", id="detail-run", variant="primary"))
            self._set_status("Enter a course code to view description.")
        elif button_id == "action-schedule":
            form = self.query_one("#form", Vertical)
            form.mount(Select(_collection_options(), id="schedule-collection"))
            form.mount(Static("Select a term to configure schedule options.", id="schedule-term-hint"))
            self._set_status("Add courses manually or load a config file, then generate the schedule.")
            self._update_schedule_preview()
        elif button_id == "action-export":
            form = self.query_one("#form", Vertical)
            form.mount(Input(placeholder=f"Path to .out file (default: {self.setting.outDir})", id="export-file"))
            form.mount(Button("Export PDF", id="export-run", variant="primary"))
            self._set_status("Export the schedule .out to PDF.")

    @on(Button.Pressed, "#detail-run")
    def on_detail_run(self) -> None:
        course = self.query_one("#detail-input", Input).value.strip()
        if not course:
            self._set_status("Please enter a course code.")
            return
        course_info = get_course_detail(self.db, course)
        if not course_info:
            self._set_output(f"Course not found: {course}")
            return
        detail = [
            f"{course} — {course_info.get('courseDescription') or 'No description'}",
            f"Credit: {course_info.get('courseCredit') or 'N/A'}",
        ]
        requirements = course_info.get("requirementsDescription")
        if requirements:
            detail.append(f"Requirements: {requirements}")
        self._set_output("\n".join(detail))

    @on(Button.Pressed, "#schedule-run")
    def on_schedule_run(self) -> None:
        gray = self.query_one("#schedule-gray", Checkbox).value
        try:
            collection = self.query_one("#schedule-collection", Select).value
            if not collection:
                self._set_status("Please select a collection.")
                return
            self.db.switchCollection(collection)
            course_wish_list = []
            for entry in self.schedule_entries:
                course = entry["course"]
                class_id = entry.get("class_id")
                if class_id is not None:
                    course_wish_list.append(SearchAvalibleInTerm(self.db, course, class_id, quiet=True))
                else:
                    course_wish_list.append(SearchAvalibleInTerm(self.db, course, quiet=True))
            course_wish_list = [c for c in course_wish_list if c is not None]
            makeSchedule(self.db, courseWishList=course_wish_list, gray=gray)
            self._set_output(f"Schedule generated at: {self.setting.outDir}")
        except Exception as exc:
            self._set_output(f"Failed to build schedule: {exc}")

    @on(Select.Changed, "#schedule-collection")
    def on_schedule_collection_changed(self) -> None:
        collection = self.query_one("#schedule-collection", Select).value
        form = self.query_one("#form", Vertical)
        if not collection:
            return
        if self.query("#schedule-tabs"):
            return
        hint = self.query_one("#schedule-term-hint", Static)
        hint.remove()
        tabs = TabbedContent(id="schedule-tabs")
        form.mount(tabs)
        tabs.add_pane(
            TabPane(
                "Manual",
                Vertical(
                    Input(placeholder="Course code (e.g., CS 136)", id="schedule-course"),
                    Input(placeholder="Class ID (optional)", id="schedule-class-id"),
                    Horizontal(
                        Button("Add Course", id="schedule-add", variant="primary"),
                        Button("Clear List", id="schedule-clear", variant="warning"),
                    ),
                    Static("No entries yet.", id="schedule-list"),
                    Checkbox("Gray color mode", id="schedule-gray"),
                    Button("Generate Schedule", id="schedule-run", variant="primary"),
                    id="manual-pane",
                ),
            )
        )
        tabs.add_pane(
            TabPane(
                "Load Config",
                Vertical(
                    Input(placeholder="Load config file path", id="schedule-load-file"),
                    Horizontal(
                        Button("Load Config", id="schedule-load", variant="primary"),
                        Button("Save Config", id="schedule-save", variant="primary"),
                    ),
                    Input(
                        placeholder="Save config to (default: schedule.txt)",
                        id="schedule-save-file",
                    ),
                    Checkbox("Gray color mode", id="schedule-gray"),
                    Button("Generate Schedule", id="schedule-run", variant="primary"),
                    id="load-pane",
                ),
            )
        )
        self._update_schedule_preview()

    @on(Button.Pressed, "#export-run")
    def on_export_run(self) -> None:
        path = self.query_one("#export-file", Input).value.strip() or self.setting.outDir
        try:
            subprocess.run(["pdfschedule", path], check=True)
            self._set_output("PDF export completed.")
        except Exception as exc:
            self._set_output(f"Export failed: {exc}")

    @on(Button.Pressed, "#schedule-add")
    def on_schedule_add(self) -> None:
        course = self.query_one("#schedule-course", Input).value.strip()
        class_id_raw = self.query_one("#schedule-class-id", Input).value.strip()
        if not course:
            self._set_status("Please enter a course code.")
            return
        if class_id_raw:
            try:
                class_id = int(class_id_raw)
            except ValueError:
                self._set_status("Class ID must be a number.")
                return
        else:
            class_id = None
        self.schedule_entries.append({"course": course, "class_id": class_id})
        self.query_one("#schedule-course", Input).value = ""
        self.query_one("#schedule-class-id", Input).value = ""
        self._update_schedule_preview()
        self._set_status(f"Added {course} successfully.")

    @on(Button.Pressed, "#schedule-clear")
    def on_schedule_clear(self) -> None:
        self.schedule_entries = []
        self._update_schedule_preview()

    @on(Button.Pressed, "#schedule-load")
    def on_schedule_load(self) -> None:
        path = self.query_one("#schedule-load-file", Input).value.strip()
        if not path:
            self._set_status("Please enter a config file path to load.")
            return
        try:
            collection, course_wish_list = _parse_collection_file(path, self.db)
            self.schedule_entries = []
            self.query_one("#schedule-collection", Select).value = collection
            for entry in course_wish_list:
                if len(entry) == 2:
                    self.schedule_entries.append({"course": entry[0], "class_id": entry[1]})
                else:
                    self.schedule_entries.append({"course": entry[0], "class_id": None})
            self._update_schedule_preview()
            self._set_status("Config loaded.")
        except Exception as exc:
            self._set_output(f"Failed to load config: {exc}")

    @on(Button.Pressed, "#schedule-save")
    def on_schedule_save(self) -> None:
        path = self.query_one("#schedule-save-file", Input).value.strip() or "schedule.txt"
        collection = self.query_one("#schedule-collection", Select).value
        if not collection:
            self._set_status("Please enter a collection name before saving.")
            return
        try:
            with open(path, "w") as handle:
                handle.write(f"{collection}\n\n")
                for entry in self.schedule_entries:
                    if entry.get("class_id") is not None:
                        handle.write(f"{entry['course']}, {entry['class_id']}\n")
                    else:
                        handle.write(f"{entry['course']}\n")
            self._set_output(f"Config saved to: {path}")
        except Exception as exc:
            self._set_output(f"Failed to save config: {exc}")


def run_app():
    CourseApp().run()
