# uw-course

A browser-based University of Waterloo course planner backed by the live MongoDB
course database. Search courses, browse sections, build a weekly timetable, and
import/export plans — with auto-resolution for course-only plans like `CS 341`.

## Install

```bash
pip install uw-course
```

## Run

```bash
uw-course
```

Starts the web app at <http://127.0.0.1:31415> and opens it in your default browser.

Environment variables: `UW_COURSE_HOST`, `UW_COURSE_PORT`, `UW_COURSE_DEBUG`,
`UW_COURSE_NO_BROWSER`, `MONGODB_URI`.

## Plan format

```txt
Class2026Winter

CS 341
MATH 239
STAT 230, 1234
```

- first line: the term collection name (must match a real collection exactly)
- `COURSE CODE` — auto-resolve a section for this course
- `COURSE CODE, CLASS_ID` — lock this exact section

## Development

The UI is a React + Vite app in `frontend/`; the backend is Flask.

```bash
pip install -e .                  # editable backend install
./scripts/build_frontend.sh       # build the UI into the package, then run `uw-course`
npm --prefix frontend run dev     # live UI development (proxies /api to Flask)
```

The published package and Docker image bundle the compiled UI, so a PyPI install
runs with no build step. The release workflow builds the frontend automatically
before packaging.

### Web API

`GET /api/terms` · `GET /api/courses?term=&q=` · `GET /api/courses/<code>?term=` ·
`POST /api/schedule` · `POST /api/plan/parse` · `POST /api/plan/export` ·
`POST /api/plan/resolve`

## License

MIT — see [LICENSE](LICENSE).
