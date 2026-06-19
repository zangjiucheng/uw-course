import os
import sys
import threading
import webbrowser

if __package__ in (None, ""):
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
    __package__ = "uw_course"

from uw_course.web.app import run_app


def _env_flag(name: str) -> bool:
    return os.environ.get(name, "").lower() in {"1", "true", "yes"}


def _maybe_open_browser(host: str, port: int, debug: bool) -> None:
    # Skip when explicitly disabled, in debug mode (the reloader would open
    # twice), or when binding to all interfaces (typically headless/containers).
    if debug or _env_flag("UW_COURSE_NO_BROWSER") or host in {"0.0.0.0", "::"}:
        return
    url = f"http://{host}:{port}/"
    threading.Timer(1.0, lambda: webbrowser.open(url)).start()


def main():
    host = os.environ.get("UW_COURSE_HOST", "127.0.0.1")
    port = int(os.environ.get("UW_COURSE_PORT", "31415"))
    debug = _env_flag("UW_COURSE_DEBUG")

    _maybe_open_browser(host, port, debug)
    print(f"UW Course Planner running at http://{host}:{port}/  (Ctrl+C to stop)")
    run_app(host=host, port=port, debug=debug)


if __name__ == "__main__":
    main()
