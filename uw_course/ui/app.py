import re
import subprocess

from textual import on
from textual import events
from textual.app import App, ComposeResult
from textual.containers import Horizontal, Vertical
from textual.coordinate import Coordinate
from textual.screen import ModalScreen
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
    schedule_tabs_with_options,
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


def _label_collection(name):
    match = re.match(r"^Class(\d{4})([A-Za-z]+)$", name)
    if match:
        year, term = match.groups()
        return f"{year} {term}"
    return name


def _vertical_label(label):
    cleaned = re.sub(r"\\s+", "", label)
    return "\\n".join(cleaned) if cleaned else label


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
        ("enter", "edit_cell", "Edit Cell"),
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
        min-width: 18;
        height: 3;
        padding: 0 2;
        text-style: bold;
        border: round #3b4261;
        background: #1f2335;
        color: #c0caf5;
    }

    #actions Button:hover {
        background: #24283b;
        border: round #7aa2f7;
    }

    #actions Button:focus {
        outline: none;
        border: round #7aa2f7;
    }

    #action-schedule {
        background: #7aa2f7;
        color: #1a1b26;
        border: round #7aa2f7;
    }

    #action-schedule:hover {
        background: #89b4fa;
    }

    #action-detail {
        background: #1f2335;
        color: #c0caf5;
        border: round #3b4261;
    }

    #action-detail:hover {
        background: #24283b;
    }

    #action-quit {
        background: #f7768e;
        color: #1a1b26;
        border: round #f7768e;
    }

    #action-quit:hover {
        background: #ff7a93;
    }

    #schedule-buttons {
        height: auto;
        margin: 1 0 0 0;
    }

    #schedule-buttons Button {
        width: auto;
        min-width: 16;
    }

    #schedule-edit-buttons {
        height: auto;
        margin: 1 0;
    }

    #schedule-edit-buttons Button {
        width: auto;
        min-width: 16;
    }

    .cell-editor-screen {
        background: #1a1b26;
    }

    #cell-editor {
        height: 1fr;
        padding: 2;
    }

    #cell-editor-title {
        color: #7aa2f7;
        text-style: bold;
        margin: 0 0 1 0;
    }

    #cell-editor-input {
        height: auto;
        border: round #3b4261;
        background: #1f2335;
        color: #c0caf5;
        padding: 0 1;
        text-style: bold;
    }

    #cell-editor-buttons {
        margin: 1 0 0 0;
    }

    #cell-editor-buttons Button {
        width: 1fr;
        min-width: 16;
    }

    #manual-actions {
        height: auto;
        margin: 1 0 0 0;
    }

    #manual-actions Button {
        width: auto;
        min-width: 16;
    }

    #manual-actions Checkbox {
        margin: 0 1;
    }

    #manual-options {
        height: auto;
        margin: 1 0 0 0;
    }

    #manual-options Button {
        width: auto;
        min-width: 16;
    }

    #manual-options Checkbox {
        margin: 0 1 0 0;
    }

    #load-pane {
        height: auto;
    }

    #load-options {
        height: auto;
        margin: 1 0 0 0;
    }

    #load-options Button {
        width: auto;
        min-width: 16;
    }

    #load-options Checkbox {
        margin: 0 1 0 0;
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
        height: 6;
        border: round #3b4261;
    }
    """

    def __init__(self):
        super().__init__()
        self.db = dbClass()
        self.setting = Setting()
        self.schedule_entries = []
        self.output_placeholder = SCHEDULE_PLACEHOLDER
        self._editing_cell = None

    def on_mount(self) -> None:
        self._set_sidebar(SIDEBAR_TITLE_SCHEDULE, SCHEDULE_PLACEHOLDER)
        self._mount_schedule_form()

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
        collections = self.db.listClassCollections()
        if not collections:
            self._set_status("No term collections found in the database.")
        options = [(_label_collection(name), name) for name in collections]
        form.mount(schedule_tabs_with_options(options))
        if collections:
            self._set_status("Add courses manually or load a config file, then generate the schedule.")
        self._update_schedule_preview()

    def _update_schedule_preview(self):
        if not self.query("#schedule-table"):
            return
        table = self.query_one("#schedule-table", DataTable)
        table.clear(columns=True)
        table.show_row_labels = True
        if not self.schedule_entries:
            table.add_columns("No Courses")
            table.add_row("", label="Course")
            table.add_row("", label="Class ID")
            return
        table.show_header = False
        table.add_columns(*[entry["course"] for entry in self.schedule_entries])
        courses = [entry["course"] for entry in self.schedule_entries]
        class_ids = [
            "" if entry.get("class_id") is None else str(entry.get("class_id"))
            for entry in self.schedule_entries
        ]
        table.add_row(*courses, label="Course")
        table.add_row(*class_ids, label="Class ID")

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
        self._build_schedule(gray)

    def _build_schedule(self, gray: bool, collection_override: str | None = None) -> None:
        try:
            if collection_override:
                collection = collection_override
                if self.query("#schedule-collection"):
                    self.query_one("#schedule-collection", Select).value = collection
            else:
                collection = self.query_one("#schedule-collection", Select).value
                if not isinstance(collection, str) or not collection:
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
        if not collection:
            return
        if self.query("#schedule-term-hint"):
            hint = self.query_one("#schedule-term-hint", Static)
            hint.remove()
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
        col_index = table.cursor_column
        if col_index is None:
            self._set_status("Select a column to remove.")
            return
        if col_index >= len(self.schedule_entries):
            self._set_status("Selected row is out of range. Refreshing list.")
            self._update_schedule_preview()
            return
        self.schedule_entries.pop(col_index)
        self._update_schedule_preview()
        self._set_status("Removed selected entry.")

    @on(DataTable.CellSelected, "#schedule-table")
    def on_schedule_cell_selected(self, event: DataTable.CellSelected) -> None:
        if not self.schedule_entries:
            return
        self._editing_cell = (event.coordinate.row, event.coordinate.column)
        self._set_status("Press Enter to edit the selected cell.")

    def on_key(self, event: events.Key) -> None:
        if event.key not in ("enter", "e"):
            return
        if not self.query("#schedule-table"):
            return
        table = self.query_one("#schedule-table", DataTable)
        if not table.has_focus:
            return
        self.action_edit_cell()
        event.stop()

    def action_edit_cell(self) -> None:
        if not self.query("#schedule-table"):
            return
        table = self.query_one("#schedule-table", DataTable)
        row_index = table.cursor_row
        col_index = table.cursor_column
        if row_index is None or col_index is None:
            self._set_status("Select a cell to edit.")
            return
        if col_index >= len(self.schedule_entries):
            self._set_status("Selected column is out of range. Refreshing list.")
            self._update_schedule_preview()
            return
        self._editing_cell = (row_index, col_index)
        self._show_cell_editor(row_index, col_index)

    def _show_cell_editor(self, row_index, col_index):
        if not self.query("#schedule-table"):
            return
        table = self.query_one("#schedule-table", DataTable)
        cell_value = table.get_cell_at(Coordinate(row_index, col_index))
        self._editing_cell = (row_index, col_index)
        screen = _CellEditorScreen(
            f"Edit cell ({row_index}, {col_index})",
            "" if cell_value is None else str(cell_value),
        )
        self._set_status("Editing cell: press Enter to save and refresh.")
        self.push_screen(screen, self._apply_cell_edit)

    def _apply_cell_edit(self, value: str) -> None:
        if value is None:
            self._set_status("Edit canceled.")
            return
        if self._editing_cell is None:
            return
        row_index, col_index = self._editing_cell
        if col_index >= len(self.schedule_entries):
            self._set_status("Selected column is out of range. Refreshing list.")
            self._update_schedule_preview()
            return
        new_value = value.strip()
        if row_index == 0:
            if not new_value:
                self._set_status("Course code cannot be empty.")
                return
            self.schedule_entries[col_index]["course"] = new_value
        else:
            if new_value:
                try:
                    self.schedule_entries[col_index]["class_id"] = int(new_value)
                except ValueError:
                    self._set_status("Class ID must be a number.")
                    return
            else:
                self.schedule_entries[col_index]["class_id"] = None
        self._update_schedule_preview()
        self._set_status("Updated entry.")

    @on(Button.Pressed, "#schedule-load")
    def on_schedule_load(self) -> None:
        if not self.query("#schedule-load-file"):
            self._set_status("Switch to Load Config tab first.")
            return
        path = (
            self.query_one("#schedule-load-file", Input).value.strip()
            or f"{self.setting.dataName}/schema.txt"
        )
        if not path:
            self._set_status("Please enter a config file path to load.")
            return
        self._set_status(f"Loading config from {path} ...")
        self.refresh()
        self.call_later(self._load_config, path)

    def _load_config(self, path: str) -> None:
        try:
            self._set_status(f"Reading {path} ...")
            collection, course_wish_list = _parse_collection_file(path, self.db)
            self.schedule_entries = []
            self.query_one("#schedule-collection", Select).value = collection
            for entry in course_wish_list:
                if len(entry) == 2:
                    self.schedule_entries.append({"course": entry[0], "class_id": entry[1]})
                else:
                    self.schedule_entries.append({"course": entry[0], "class_id": None})
            self._update_schedule_preview()
            gray = self.query_one("#schedule-gray", Checkbox).value
            self._build_schedule(gray, collection_override=collection)
            self._set_status("Config loaded and schedule generated.")
        except Exception as exc:
            self._set_status(f"Failed to load config: {exc}")
            self._set_output(f"Failed to load config: {exc}")

    @on(Button.Pressed, "#schedule-save")
    def on_schedule_save(self) -> None:
        path = (
            self.query_one("#schedule-save-file", Input).value.strip()
            or f"{self.setting.dataName}/schema.txt"
        )
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


class _CellEditorScreen(ModalScreen[str]):
    def __init__(self, title, value):
        super().__init__()
        self._title = title
        self._value = value

    def on_mount(self) -> None:
        self.add_class("cell-editor-screen")

    def compose(self) -> ComposeResult:
        with Vertical(id="cell-editor"):
            yield Static(self._title, id="cell-editor-title")
            yield Input(value=self._value, id="cell-editor-input")
            with Horizontal(id="cell-editor-buttons"):
                yield Button("Save", id="cell-editor-save", variant="primary")
                yield Button("Cancel", id="cell-editor-cancel")

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "cell-editor-save":
            value = self.query_one("#cell-editor-input", Input).value
            self.dismiss(value)
        elif event.button.id == "cell-editor-cancel":
            self.dismiss(None)

    def on_input_submitted(self, event: Input.Submitted) -> None:
        self.dismiss(event.value)


def run_app():
    CourseApp().run()
