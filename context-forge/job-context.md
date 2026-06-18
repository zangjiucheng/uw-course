# Job Context — #39

**Subject:** Change default web server port to 31415
**Type:** task

## Description
Change the application's default port from `8120` to the unusual port **31415**, while keeping the `UW_COURSE_PORT` environment override working.

## Changes
- `uw_course/main.py` — change the `UW_COURSE_PORT` fallback from `8120` to `31415`.
- `uw_course/web/app.py` — change the `run_app(..., port: int = 8120, ...)` default to `31415`.
- `README.md` — update the "By default the server runs at http://127.0.0.1:8120" line to `http://127.0.0.1:31415`.

## Acceptance criteria
- Running `uw-course` or `python -m uw_course` with no env vars binds to `127.0.0.1:31415`.
- Setting `UW_COURSE_PORT` still overrides the default.
- README reflects the new default port (31415).
- No other behavior changes.
