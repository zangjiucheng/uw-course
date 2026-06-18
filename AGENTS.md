# Task #39 — Change default web server port to 31415

Parent Epic: none (standalone task — branches off and merges into main)
Project: #3

## Task Description
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

## Your Job
Implement this task. Read the full task description above. Understand what needs to be built. Then implement it.

## Context
- Branch: task/39-... (check `git branch`)
- Full task context: `context-forge/job-context.md`
- Verification schema: `../prompts/verification.md`
- Standards: `../standards/README.md` (read only docs relevant to this repo)
- Dependencies: `openproject_get_dependencies` in OpenProject MCP

## Submodules
If this repository uses git submodules, implement changes inside the submodule, commit there, then update the parent repo's submodule pointer. Verification checks the parent branch's recorded submodule SHAs — code that only exists inside an uncommitted submodule will fail.
