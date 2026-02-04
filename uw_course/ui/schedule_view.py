import re


def parse_schedule_out(path):
    items = []
    current = {}
    try:
        with open(path, "r") as handle:
            for raw_line in handle:
                line = raw_line.strip()
                if not line:
                    if current:
                        items.append(current)
                        current = {}
                    continue
                if line.startswith("- name:"):
                    if current:
                        items.append(current)
                        current = {}
                    current["name"] = line[len("- name:") :].strip()
                elif line.startswith("days:"):
                    current["days"] = line[len("days:") :].strip()
                elif line.startswith("time:"):
                    current["time"] = line[len("time:") :].strip()
        if current:
            items.append(current)
    except FileNotFoundError:
        return []
    return items


def split_days(days):
    cleaned = re.sub(r"[^A-Za-z]", "", days)
    tokens = re.findall(r"Th|Tu|Sa|Su|[MTWHFSU]", cleaned)
    mapping = {
        "M": "Mon",
        "T": "Tue",
        "Tu": "Tue",
        "W": "Wed",
        "H": "Thu",
        "Th": "Thu",
        "F": "Fri",
        "S": "Sat",
        "Sa": "Sat",
        "U": "Sun",
        "Su": "Sun",
    }
    return [mapping[token] for token in tokens if token in mapping]


def time_to_minutes(raw_time):
    try:
        hours, minutes = raw_time.split(":")
        return int(hours) * 60 + int(minutes)
    except ValueError:
        return 0


def render_weekly_schedule(path):
    items = parse_schedule_out(path)
    if not items:
        return "No schedule generated yet."

    weekly = {day: [] for day in ("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")}
    for item in items:
        name = item.get("name", "").split("Available Seat")[0].strip()
        time_range = item.get("time", "")
        if " - " in time_range:
            start, end = [part.strip() for part in time_range.split(" - ", 1)]
        else:
            start, end = time_range, ""
        for day in split_days(item.get("days", "")):
            weekly[day].append((start, end, name))

    lines = ["Weekly Schedule"]
    for day in weekly:
        lines.append(f"{day}:")
        entries = sorted(weekly[day], key=lambda x: time_to_minutes(x[0]))
        if not entries:
            lines.append("  (no classes)")
            continue
        for start, end, name in entries:
            if end:
                lines.append(f"  {start}-{end}  {name}")
            else:
                lines.append(f"  {start}  {name}")
    return "\n".join(lines)
