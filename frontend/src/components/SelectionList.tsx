import type { Section } from '../types';
import { sectionKey } from '../utils/schedule';

interface Props {
  selections: Section[];
  hoveredSectionKey: string | null;
  activeSectionKey: string | null;
  onRemove: (key: string) => void;
  onHover: (key: string | null) => void;
  onSetActive: (key: string) => void;
}

export default function SelectionList({
  selections,
  hoveredSectionKey,
  activeSectionKey,
  onRemove,
  onHover,
  onSetActive,
}: Props) {
  if (!selections.length) {
    return (
      <div className="panel-scroll selection-list empty-state">No sections selected yet.</div>
    );
  }

  return (
    <div className="panel-scroll selection-list">
      {selections.map((selection) => {
        const key = sectionKey(selection);
        return (
          <article
            key={key}
            className={`selection-item${activeSectionKey === key ? ' is-active' : ''}${hoveredSectionKey === key ? ' is-hovered' : ''}`}
            data-section-key={key}
            onMouseEnter={() => onHover(key)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onSetActive(key)}
          >
            <div>
              <h3 className="selection-title">
                {selection.course_code} · #{selection.class_id}
              </h3>
              <p className="selection-meta">
                {selection.class_title || 'Unknown'} · {selection.raw_time || 'no time data'}
              </p>
            </div>
            <button
              type="button"
              className="danger remove-selection-button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(key);
              }}
            >
              Remove
            </button>
          </article>
        );
      })}
    </div>
  );
}
