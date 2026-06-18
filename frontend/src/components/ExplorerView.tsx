import type { Section, CourseResult } from '../types';
import { sectionKey, getSectionConflicts, WEEK_DAYS } from '../utils/schedule';

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
      <div className="schedule-view">
        <div className="explorer-empty">Search for courses to explore sections here.</div>
      </div>
    );
  }

  return (
    <div className="schedule-view">
      <div className="explorer-grid">
        {displaySections.map((section) => {
          const key = sectionKey(section);
          const isSelected = selectedKeys.has(key);
          const conflictDetails = getSectionConflicts(section, scheduleItems);
          const hasConflict = isSelected
            ? WEEK_DAYS.some((day) => conflictMap.has(`${key}::${day}`))
            : conflictDetails.length > 0;

          return (
            <article
              key={key}
              className={`explorer-card${isSelected ? ' is-selected' : ''}${
                hasConflict && !isSelected ? ' is-conflict' : ''
              }${hoveredSectionKey === key ? ' is-hovered' : ''}${
                activeSectionKey === key ? ' is-active' : ''
              }`}
              data-section-key={key}
              onMouseEnter={() => onHover(key)}
              onMouseLeave={() => onHover(null)}
              onClick={() => onSetActive(key)}
            >
              <div className="explorer-card-header">
                <div>
                  <h3 className="explorer-card-title">
                    {section.course_code} · {section.class_title}
                  </h3>
                  <p className="explorer-card-meta">
                    #{section.class_id} · seats {section.available_seat ?? '?'}
                  </p>
                </div>
                <span
                  className={`explorer-card-badge${isSelected ? ' is-selected' : ''}${
                    hasConflict && !isSelected ? ' is-conflict' : ''
                  }`}
                >
                  {isSelected ? 'Selected' : hasConflict ? 'Conflict' : ''}
                </span>
              </div>
              <p className="explorer-card-time">
                {section.raw_time || 'No time data available'}
              </p>
              {conflictDetails.length > 0 && (
                <div className="explorer-card-conflict">
                  Conflicts with{' '}
                  {conflictDetails
                    .map((s) => `${s.course_code} #${s.class_id}`)
                    .join(', ')}
                </div>
              )}
              <div className="explorer-card-actions">
                <button
                  type="button"
                  className={isSelected ? 'danger' : ''}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isSelected) onRemoveSection(key);
                    else onAddSection(section);
                  }}
                >
                  {isSelected ? 'Remove from Plan' : 'Add to Plan'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
