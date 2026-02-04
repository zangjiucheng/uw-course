import subprocess

from textual import on
from textual.app import App, ComposeResult
from textual.containers import Horizontal, Vertical
from textual.widgets import (
    Button,
    Checkbox,
    DataTable,
    Footer,
    Header,
    Input,
    Select,
    Static,
)

from uw_course.ui.components import (
    detail_form_widgets,
    schedule_setup_widgets,
    schedule_tabs,
)
from uw_course.ui.constants import (
    ACTION_DETAIL,
    ACTION_QUIT,
    ACTION_SCHEDULE,
    DETAIL_PLACEHOLDER,
    SCHEDULE_PLACEHOLDER,
    SIDEBAR_TITLE_DETAIL,
    SIDEBAR_TITLE_SCHEDULE,
)
from uw_course.ui.schedule_view import render_weekly_schedule

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
    Screen {
        background: #1a1b26;
        color: #c0caf5;
    }

    #app-body { padding: 1 2; }

    #layout {
        height: 1fr;
    }

    #main {
        width: 3fr;
        height: 1fr;
    }

    #sidebar {
        width: 2fr;
        height: 1fr;
        margin: 0 0 0 2;
        padding: 1;
        background: $panel;
        border: round $secondary;
    }

    #title {
        margin: 1 0 0 0;
        color: #7aa2f7;
        text-style: bold;
    }

    #subtitle {
        margin: 0 0 1 0;
        color: #9aa5ce;
    }

    #sidebar-title {
        color: #7aa2f7;
        text-style: bold;
        margin: 0 0 1 0;
    }

    #actions {
        height: auto;
        margin: 0 0 1 0;
        padding: 1;
        background: #1f2335;
        border: round #3b4261;
    }

    #status {
        height: auto;
        color: #9aa5ce;
        margin: 0 0 1 0;
    }

    #form {
        height: 1fr;
        overflow-y: auto;
        padding: 1;
        background: #24283b;
        border: round #3b4261;
    }

    #output {
        height: 1fr;
        border: round #7aa2f7;
        padding: 1;
        margin: 1 0 0 0;
        background: #1a1b26;
    }

    #schedule-tabs { height: auto; }
    #manual-pane, #load-pane { height: auto; }

    #actions Button {
        margin: 0 1 0 0;
        width: 1fr;
        min-width: 16;
        text-style: bold;
    }

    #actions Button:focus {
        outline: none;
    }

    #action-detail {
        background: #1a1b26;
        color: #c0caf5;
    }

    #action-detail:hover {
        background: #24283b;
    }

    #schedule-buttons {
        height: auto;
        margin: 1 0 0 0;
    }

    #schedule-buttons Button {
        width: 1fr;
        min-width: 16;
    }

    Button.-primary {
        background: #7aa2f7;
        color: #1a1b26;
        text-style: bold;
    }

    Button.-error {
        background: #f7768e;
        color: #1a1b26;
        text-style: bold;
    }

    Input, Select {
        margin: 0 0 1 0;
    }

    DataTable {
        margin: 1 0;
        height: 8;
        border: round #3b4261;
    }
    """

    def __init__(self):
        super().__init__()
        self.db = dbClass()
        self.setting = Setting()
        self.schedule_entries = []
        self.output_placeholder = SCHEDULE_PLACEHOLDER

    def compose(self) -> ComposeResult:
        yield Header()
        with Vertical(id="app-body"):
            yield Static("UW Course Helper", id="title")
            yield Static("Search courses, build schedules, export PDFs.", id="subtitle")
            with Horizontal(id="actions"):
                yield Button("Build Schedule", id="action-schedule", variant="primary")
                yield Button("Check Course Detail", id="action-detail")
                yield Button("Quit", id="action-quit", variant="error")
            yield Static("Choose an action to begin.", id="status")
            with Horizontal(id="layout"):
                with Vertical(id="main"):
                    yield Vertical(id="form")
                with Vertical(id="sidebar"):
                    yield Static(SIDEBAR_TITLE_SCHEDULE, id="sidebar-title")
                    output = Static(SCHEDULE_PLACEHOLDER, id="output")
                    output.display = True
                    yield output
        yield Footer()

    def _set_status(self, message):
        self.query_one("#status", Static).update(message)

    def _set_output(self, message):
        output = self.query_one("#output", Static)
        output.update(message or self.output_placeholder)
        output.display = True

    def _set_sidebar_title(self, title):
        self.query_one("#sidebar-title", Static).update(title)

    def _reset_form(self):
        form = self.query_one("#form", Vertical)
        form.remove_children()
        for widget in self.query("#schedule-collection, #schedule-tabs, #schedule-term-hint"):
            widget.remove()
        self._set_output("")

    def _set_sidebar(self, title, placeholder):
        self.output_placeholder = placeholder
        self._set_sidebar_title(title)
        self._set_output("")

    def _mount_detail_form(self):
        if self.query("#detail-input"):
            self.query_one("#detail-input", Input).focus()
            return
        form = self.query_one("#form", Vertical)
        for widget in detail_form_widgets():
            form.mount(widget)
        self._set_status("Enter a course code to view description.")

    def _mount_schedule_form(self):
        if self.query("#schedule-collection"):
            self.query_one("#schedule-collection", Select).focus()
            return
        form = self.query_one("#form", Vertical)
        for widget in schedule_setup_widgets(_collection_options()):
            form.mount(widget)
        self._set_status("Add courses manually or load a config file, then generate the schedule.")
        self._update_schedule_preview()

    def _update_schedule_preview(self):
        if not self.query("#schedule-table"):
            return
        table = self.query_one("#schedule-table", DataTable)
        table.clear(columns=True)
        table.add_columns("Course", "Class ID")
        for entry in self.schedule_entries:
            class_id = entry.get("class_id")
            table.add_row(entry["course"], "" if class_id is None else str(class_id))

    def on_button_pressed(self, event):
        button_id = event.button.id
        if button_id is None or not button_id.startswith("action-"):
            return
        if button_id == ACTION_QUIT:
            self.exit()
            return

        self._reset_form()

        if button_id == ACTION_DETAIL:
            self._set_sidebar(SIDEBAR_TITLE_DETAIL, DETAIL_PLACEHOLDER)
            self._mount_detail_form()
        elif button_id == ACTION_SCHEDULE:
            self._set_sidebar(SIDEBAR_TITLE_SCHEDULE, SCHEDULE_PLACEHOLDER)
            self._mount_schedule_form()

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
            self._set_output(render_weekly_schedule(self.setting.outDir))
            self._set_status("Schedule generated.")
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
        form.mount(schedule_tabs())
        self._update_schedule_preview()

    @on(Button.Pressed, "#schedule-export")
    def on_export_run(self) -> None:
        try:
            subprocess.run(["pdfschedule", self.setting.outDir], check=True)
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
        self._set_status("Cleared schedule list.")

    @on(Button.Pressed, "#schedule-remove")
    def on_schedule_remove(self) -> None:
        if not self.query("#schedule-table"):
            return
        if not self.schedule_entries:
            self._set_status("No entries to remove.")
            return
        table = self.query_one("#schedule-table", DataTable)
        row_index = table.cursor_row
        if row_index is None:
            self._set_status("Select a row to remove.")
            return
        if row_index >= len(self.schedule_entries):
            self._set_status("Selected row is out of range. Refreshing list.")
            self._update_schedule_preview()
            return
        self.schedule_entries.pop(row_index)
        self._update_schedule_preview()
        self._set_status("Removed selected entry.")

    @on(DataTable.CellSelected, "#schedule-table")
    def on_schedule_cell_selected(self, event: DataTable.CellSelected) -> None:
        if not self.schedule_entries:
            return
        edit = self.query_one("#schedule-edit", Input)
        edit.value = str(event.value) if event.value is not None else ""

    @on(Input.Submitted, "#schedule-edit")
    def on_schedule_edit_submitted(self, event: Input.Submitted) -> None:
        if not self.query("#schedule-table"):
            return
        table = self.query_one("#schedule-table", DataTable)
        row_index = table.cursor_row
        col_index = table.cursor_column
        if row_index is None or col_index is None:
            self._set_status("Select a cell to edit.")
            return
        if row_index >= len(self.schedule_entries):
            self._set_status("Selected row is out of range. Refreshing list.")
            self._update_schedule_preview()
            return
        new_value = event.value.strip()
        if col_index == 0:
            if not new_value:
                self._set_status("Course code cannot be empty.")
                return
            self.schedule_entries[row_index]["course"] = new_value
        else:
            if new_value:
                try:
                    self.schedule_entries[row_index]["class_id"] = int(new_value)
                except ValueError:
                    self._set_status("Class ID must be a number.")
                    return
            else:
                self.schedule_entries[row_index]["class_id"] = None
        self._update_schedule_preview()
        self._set_status("Updated entry.")

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
