from textual.containers import Horizontal, Vertical
from textual.widgets import (
    Button,
    Checkbox,
    DataTable,
    Input,
    Select,
    Static,
    TabbedContent,
    TabPane,
)


def detail_form_widgets():
    return [
        Input(placeholder="Course code (e.g., CS 136)", id="detail-input"),
        Button("Lookup", id="detail-run", variant="primary"),
    ]


def schedule_setup_widgets(collection_options):
    return [
        Select(collection_options, id="schedule-collection"),
        Static("Select a term to configure schedule options.", id="schedule-term-hint"),
    ]


def schedule_action_buttons():
    return Horizontal(
        Button("Generate Schedule", id="schedule-run", variant="primary"),
        Button("Export PDF", id="schedule-export"),
        id="schedule-buttons",
    )


class ScheduleTabs(TabbedContent):
    def on_mount(self) -> None:
        self.add_pane(
            TabPane(
                "Manual",
                Vertical(
                    Input(placeholder="Course code (e.g., CS 136)", id="schedule-course"),
                    Input(placeholder="Class ID (optional)", id="schedule-class-id"),
                    Horizontal(
                        Button("Add Course", id="schedule-add", variant="primary"),
                        Button("Clear List", id="schedule-clear", variant="warning"),
                        Button("Remove Selected", id="schedule-remove", variant="error"),
                    ),
                    DataTable(id="schedule-table"),
                    Input(placeholder="Edit selected cell and press Enter", id="schedule-edit"),
                    Checkbox("Gray color mode", id="schedule-gray"),
                    schedule_action_buttons(),
                    id="manual-pane",
                ),
            )
        )
        self.add_pane(
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
                    schedule_action_buttons(),
                    id="load-pane",
                ),
            )
        )


def schedule_tabs():
    return ScheduleTabs(id="schedule-tabs")
