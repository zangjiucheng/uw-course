# Task #37 — Change default port to an uncommon port

Parent Epic: none (standalone task — branches off and merges into main)
Project: #3

## Task Description
## Task: Change default port to an uncommon port

### Description
The application currently uses a common default port (e.g., 3000, 8080, or 5432). This port may conflict with other services or be predictable. Change it to a less commonly used port.

### Acceptance Criteria
- [ ] Identify the current default port in the application configuration or code
- [ ] Choose a new port that is not commonly used (e.g., avoid 3000, 3001, 8080, 8000, 5000, 5432, 6379, 27017 — pick something above 1024 that isn't a well-known service port)
- [ ] Update the configuration file or source code to use the new port
- [ ] Update any environment variable defaults, Dockerfiles, or docker-compose files if present
- [ ] Update documentation (README, etc.) to reflect the new default port
- [ ] Verify the application starts and is reachable on the new port
- [ ] Verify existing tests pass with the new port

### Suggested ports to consider
- 3120, 4120, 5120, 6120, 7120, 8120, 9120 (less common ranges)
- Avoid the IANA well-known ports (0–1023) and common registered ports used by popular services

## Your Job
Implement this task. Read the full task description above. Understand what needs to be built. Then implement it.

## Context
- Branch: task/37-... (check `git branch`)
- All dependencies are tracked in OpenProject (`openproject_get_dependencies`)
- Reference epic standards and prompts in `context-forge/` directory
