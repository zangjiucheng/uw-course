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


def schedule_term_widgets(collection_options):
    return [
        Select(collection_options, id="schedule-collection", prompt="Select term..."),
        Static("Select a term to configure schedule options.", id="schedule-term-hint"),
    ]


def schedule_action_buttons():
    return Horizontal(
        Button("Export PDF", id="schedule-export"),
        id="schedule-buttons",
    )


class ScheduleTabs(TabbedContent):
    def __init__(self, collection_options, **kwargs):
        super().__init__(**kwargs)
        self._collection_options = collection_options

    def on_mount(self) -> None:
        self.add_pane(
            TabPane(
                "Build Schedule",
                Vertical(
                    *schedule_term_widgets(self._collection_options),
                    Input(placeholder="Course code (e.g., CS 136)", id="schedule-course"),
                    Input(placeholder="Class ID (optional)", id="schedule-class-id"),
                    Horizontal(
                        Button("Add Course", id="schedule-add", variant="primary"),
                        Button("Clear List", id="schedule-clear", variant="warning"),
                        Button("Remove Selected", id="schedule-remove", variant="error"),
                        id="schedule-edit-buttons",
                    ),
                    DataTable(id="schedule-table"),
                    Input(
                        placeholder="Save config to (default: uw-course-files/schema.txt)",
                        id="schedule-save-file",
                    ),
                    Horizontal(
                        Button("Generate Schedule", id="schedule-run", variant="primary"),
                        Button("Save Config", id="schedule-save"),
                        id="manual-actions",
                    ),
                    Horizontal(
                        Checkbox("Gray color mode", id="schedule-gray"),
                        Button("Export PDF", id="schedule-export"),
                        id="manual-options",
                    ),
                    id="manual-pane",
                ),
                id="tab-build",
            )
        )
        self.add_pane(
            TabPane(
                "Load Plan",
                Vertical(
                    Input(
                        placeholder="Load config file path (default: uw-course-files/schema.txt)",
                        id="schedule-load-file",
                    ),
                    Horizontal(
                        Button("Load Config", id="schedule-load", variant="primary"),
                    ),
                    Horizontal(
                        Checkbox("Gray color mode", id="schedule-gray"),
                        Button("Export PDF", id="schedule-export"),
                        id="load-options",
                    ),
                    id="load-pane",
                ),
                id="tab-load",
            )
        )
        self.active = "tab-build"


def schedule_tabs_with_options(collection_options):
    return ScheduleTabs(collection_options, id="schedule-tabs")
