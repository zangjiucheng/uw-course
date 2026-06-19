import type { Section } from '../types';
import type { ConflictEntry } from '../utils/schedule';
import { sectionKey, formatDayTime } from '../utils/schedule';
import { courseColor } from '../utils/courseColor';

const GOOSE_CREDIT_URL = 'https://uwaterloo.ca/support/2024-uwaterloo-fsr-drawing-contest';

interface Props {
  selections: Section[];
  conflicts: ConflictEntry[];
  hoveredSectionKey: string | null;
  activeSectionKey: string | null;
  onRemove: (key: string) => void;
  onHover: (key: string | null) => void;
  onSetActive: (key: string) => void;
  onExport: () => void;
}

export default function PlanPanel({
  selections,
  conflicts,
  hoveredSectionKey,
  activeSectionKey,
  onRemove,
  onHover,
  onSetActive,
  onExport,
}: Props) {
  const timedCount = selections.filter(
    (s) => s.days?.length && s.start_time && s.end_time
  ).length;

  const conflictedKeys = new Set<string>();
  conflicts.forEach((entry) => {
    conflictedKeys.add(sectionKey(entry.first));
    conflictedKeys.add(sectionKey(entry.second));
  });

  const conflictSummary = Array.from(
    new Set(
      conflicts.map((entry) =>
        [entry.first.course_code, entry.second.course_code].sort().join(' overlaps ')
      )
    )
  );

  return (
    <aside className="plan-panel">
      <div className="plan-panel-head">
        <h3>Your plan</h3>
        <p className="plan-panel-summary">
          {selections.length} sections · {timedCount} on grid
        </p>
      </div>

      <div className="plan-list">
        {selections.length === 0 ? (
          <div className="plan-empty">
            No sections yet.
            <br />
            Search and add a course to begin.
          </div>
        ) : (
          selections.map((selection) => {
            const key = sectionKey(selection);
            const { color } = courseColor(selection.course_code);
            const conflicted = conflictedKeys.has(key);
            return (
              <div
                key={key}
                className={`plan-item${activeSectionKey === key ? ' is-active' : ''}${
                  hoveredSectionKey === key ? ' is-hovered' : ''
                }`}
                data-section-key={key}
                onMouseEnter={() => onHover(key)}
                onMouseLeave={() => onHover(null)}
                onClick={() => onSetActive(key)}
              >
                <span className="plan-item-bar" style={{ background: color }} />
                <span className="plan-item-main">
                  <span className="plan-item-codeline">
                    <span className="plan-item-code">{selection.course_code}</span>
                    {conflicted && <span className="plan-item-flag">CONFLICT</span>}
                  </span>
                  <span className="plan-item-time">
                    {formatDayTime(selection) || 'No time data'}
                  </span>
                  <span className="plan-item-meta">
                    {selection.class_title || 'Section'} · #{selection.class_id}
                  </span>
                </span>
                <button
                  type="button"
                  className="plan-item-remove"
                  title="Remove section"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(key);
                  }}
                >
                  ×
                </button>
              </div>
            );
          })
        )}

        {conflictSummary.length > 0 && (
          <div className="plan-conflicts">
            <div className="plan-conflicts-title">Schedule conflicts</div>
            {conflictSummary.map((text) => (
              <div key={text} className="plan-conflicts-item">
                {text}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="plan-panel-foot">
        <button type="button" className="plan-export-btn" onClick={onExport}>
          Export plan text
        </button>
        <a className="goose-credit" href={GOOSE_CREDIT_URL} target="_blank" rel="noreferrer">
          Goose artwork credit
        </a>
      </div>
    </aside>
  );
}
