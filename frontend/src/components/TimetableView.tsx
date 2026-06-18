import type { SchedulePayload, Section } from '../types';
import {
  WEEK_DAYS,
  DAY_LABELS,
  TIMELINE_PADDING,
  getTimelineConfig,
  parseClockToMinutes,
  sectionKey,
} from '../utils/schedule';

interface Props {
  payload: SchedulePayload;
  hoveredSection: Section | null;
  hoveredSectionKey: string | null;
  activeSectionKey: string | null;
  conflictMap: Map<string, Section[]>;
  onHoverSection: (key: string | null) => void;
  onSetActive: (key: string) => void;
  onBlockMouseEnter: (section: Section, event: React.MouseEvent<HTMLDivElement>) => void;
  onBlockMouseLeave: () => void;
}

export default function TimetableView({
  payload,
  hoveredSection,
  hoveredSectionKey,
  activeSectionKey,
  conflictMap,
  onHoverSection,
  onSetActive,
  onBlockMouseEnter,
  onBlockMouseLeave,
}: Props) {
  const items = payload.items || [];
  const timedItems = items.filter((item) => item.days?.length && item.start_time && item.end_time);
  const timeline = getTimelineConfig(items);

  const visibleDays = WEEK_DAYS.filter((day) => {
    if (day !== 'Sat' && day !== 'Sun') return true;
    return timedItems.some((item) => item.days.includes(day));
  });

  if (!timedItems.length) {
    return (
      <div className="schedule-view">
        <div className="explorer-empty">
          No timed sections available for the current selection.
        </div>
      </div>
    );
  }

  const laneHeight = timeline.height + TIMELINE_PADDING * 2;

  function blockStyle(section: Section): React.CSSProperties {
    const start = parseClockToMinutes(section.start_time);
    const end = parseClockToMinutes(section.end_time);
    const top =
      TIMELINE_PADDING + ((start - timeline.startHour * 60) / timeline.totalMinutes) * timeline.height;
    const height = Math.max(((end - start) / timeline.totalMinutes) * timeline.height, 44);
    return { top: `${top}px`, height: `${height}px` };
  }

  const isHoveredAlreadyPlaced =
    hoveredSection && items.some((s) => sectionKey(s) === sectionKey(hoveredSection));

  return (
    <div className="schedule-view">
      <div className="week-shell">
        <div
          className="week-board"
          style={{
            gridTemplateColumns: `72px repeat(${visibleDays.length}, minmax(118px, 1fr))`,
            minWidth: `${72 + visibleDays.length * 118 + visibleDays.length * 8}px`,
          }}
        >
          <div className="time-header">Time</div>
          {visibleDays.map((day) => (
            <div key={day} className="day-header">
              <strong>{day}</strong>
              <span>{DAY_LABELS[day]}</span>
            </div>
          ))}

          <div className="time-rail" style={{ height: `${laneHeight}px` }}>
            {timeline.hours.map((hour) => (
              <div
                key={hour}
                className="time-marker"
                style={{
                  top: `${
                    TIMELINE_PADDING +
                    ((hour - timeline.startHour) / (timeline.endHour - timeline.startHour)) *
                      timeline.height
                  }px`,
                }}
              >
                {String(hour).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {visibleDays.map((day) => {
            const dayItems = timedItems.filter((item) => item.days.includes(day));
            const showPreview =
              hoveredSection &&
              !isHoveredAlreadyPlaced &&
              hoveredSection.start_time &&
              hoveredSection.end_time &&
              hoveredSection.days?.includes(day);

            return (
              <div
                key={day}
                className={`day-lane${
                  hoveredSection?.days?.includes(day) ? ' is-hovered' : ''
                }`}
                data-day={day}
                style={{ height: `${laneHeight}px` }}
              >
                {dayItems.length === 0 && (
                  <div className="day-lane-empty">Open</div>
                )}
                {dayItems.map((item) => {
                  const key = sectionKey(item);
                  return (
                    <div
                      key={key}
                      className={`schedule-block${hoveredSectionKey === key ? ' is-hovered' : ''}${
                        activeSectionKey === key ? ' is-active' : ''
                      }${conflictMap.has(`${key}::${day}`) ? ' is-conflict' : ''}`}
                      data-section-key={key}
                      style={blockStyle(item)}
                      onMouseEnter={(e) => {
                        onHoverSection(key);
                        onBlockMouseEnter(item, e);
                      }}
                      onMouseMove={(e) => onBlockMouseEnter(item, e)}
                      onMouseLeave={() => {
                        onHoverSection(null);
                        onBlockMouseLeave();
                      }}
                      onClick={() => onSetActive(key)}
                    >
                      <strong>
                        {item.course_code} · {item.class_title}
                      </strong>
                      <p>
                        {item.start_time} - {item.end_time} · #{item.class_id}
                      </p>
                    </div>
                  );
                })}
                {showPreview && hoveredSection && (
                  <div
                    className="schedule-preview-block"
                    style={blockStyle(hoveredSection)}
                  >
                    <strong>{hoveredSection.course_code}</strong>
                    <p>
                      {hoveredSection.class_title} · #{hoveredSection.class_id}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
