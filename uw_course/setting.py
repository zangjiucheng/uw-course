from os import makedirs
from os.path import join
from pathlib import Path


class Setting:
    def __init__(self, data_dir: str | None = None):
        if data_dir is not None:
            self.data_name = Path(data_dir).expanduser().resolve()
        else:
            self.data_name = Path.home() / ".uw-course" / "uw-course-files"

        self.config_file_name = "schedule.out"

        try:
            self.data_name.mkdir(parents=True, exist_ok=True)
        except PermissionError:
            raise RuntimeError(f"Permission denied: cannot create {self.data_name}")
        except OSError as e:
            raise RuntimeError(f"Failed to create {self.data_name}: {e}")

        self.out_dir = join(str(self.data_name), self.config_file_name)
