import os
import sys

if __package__ in (None, ""):
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
    __package__ = "uw_course"

from uw_course.web.app import run_app


def main():
    host = os.environ.get("UW_COURSE_HOST", "127.0.0.1")
    port = int(os.environ.get("UW_COURSE_PORT", "8000"))
    debug = os.environ.get("UW_COURSE_DEBUG", "").lower() in {"1", "true", "yes"}
    run_app(host=host, port=port, debug=debug)


if __name__ == "__main__":
    main()
