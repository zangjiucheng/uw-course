import type { Section, CourseResult } from '../types';
import {
  sectionKey,
  getSectionConflicts,
  WEEK_DAYS,
  formatDayTime,
} from '../utils/schedule';
import { courseColor } from '../utils/courseColor';

interface Props {
  searchResults: CourseResult[];
  scheduleItems: Section[];
  selections: Section[];
  hoveredSectionKey: string | null;
  activeSectionKey: string | null;
  conflictMap: Map<string, Section[]>;
  onAddSection: (section: Section) => void;
  onRemoveSection: (key: string) => void;
  onHover: (key: string | null) => void;
  onSetActive: (key: string) => void;
}

export default function ExplorerView({
  searchResults,
  scheduleItems,
  selections,
  hoveredSectionKey,
  activeSectionKey,
  conflictMap,
  onAddSection,
  onRemoveSection,
  onHover,
  onSetActive,
}: Props) {
  const allFromSearch = searchResults.flatMap((course) => course.sections);
  const displaySections = allFromSearch.length ? allFromSearch : scheduleItems;
  const selectedKeys = new Set(selections.map(sectionKey));

  if (!displaySections.length) {
    return (
      <div className="explorer">
        <div className="empty-note">Search for courses to explore their sections here.</div>
      </div>
    );
  }

  return (
    <div className="explorer">
      <div className="explorer-head">
        <h2>Section Explorer</h2>
        <span>{displaySections.length} sections · conflicts flagged against your plan</span>
      </div>
      <div className="explorer-grid">
        {displaySections.map((section) => {
          const key = sectionKey(section);
          const isSelected = selectedKeys.has(key);
          const { color, bg } = courseColor(section.course_code);
          const conflictDetails = getSectionConflicts(section, scheduleItems);
          const hasConflict = isSelected
            ? WEEK_DAYS.some((day) => conflictMap.has(`${key}::${day}`))
            : conflictDetails.length > 0;

          return (
            <article
              key={key}
              className={`explorer-card${hoveredSectionKey === key ? ' is-hovered' : ''}${
                activeSectionKey === key ? ' is-active' : ''
              }`}
              data-section-key={key}
              style={{
                borderColor: isSelected ? color : 'var(--line)',
                background: isSelected ? bg : '#fff',
              }}
              onMouseEnter={() => onHover(key)}
              onMouseLeave={() => onHover(null)}
              onClick={() => onSetActive(key)}
            >
              <div className="explorer-card-top">
                <span className="explorer-dot" style={{ background: color }} />
                <span className="explorer-card-code">{section.course_code}</span>
                <span style={{ flex: 1 }} />
                <span className="explorer-card-tag" style={{ background: bg, color }}>
                  {section.class_title || 'SEC'}
                </span>
              </div>
              <div className="explorer-card-title">{section.class_title || section.course_code}</div>
              <div className="explorer-card-time">{formatDayTime(section) || 'No time data'}</div>
              <div className="explorer-card-meta">
                #{section.class_id} · seat {section.available_seat ?? '?'}
              </div>
              <div className="explorer-card-actions">
                <button
                  type="button"
                  className="explorer-add-btn"
                  style={isSelected ? { background: '#fff', color, borderColor: color } : undefined}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isSelected) onRemoveSection(key);
                    else onAddSection(section);
                  }}
                >
                  {isSelected ? 'In plan' : 'Add section'}
                </button>
                {hasConflict && !isSelected && (
                  <span className="explorer-conflict-flag">
                    <span className="conflict-pip">!</span>
                    conflict
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
