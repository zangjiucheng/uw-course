import os
import sys

if __package__ in (None, ""):
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
    __package__ = "uw_course"

from uw_course.ui.app import run_app


def main():
    run_app()


if __name__ == "__main__":
    main()
