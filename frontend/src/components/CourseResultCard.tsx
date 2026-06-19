import { useState } from 'react';
import type { CourseResult, Section } from '../types';
import { sectionKey, formatDayTime } from '../utils/schedule';
import { courseColor } from '../utils/courseColor';

interface Props {
  course: CourseResult;
  selectedKeys: Set<string>;
  defaultExpanded?: boolean;
  onAddSection: (section: Section) => void;
  onRemoveSection: (key: string) => void;
  onHover: (key: string | null) => void;
  onSetActive: (key: string) => void;
}

export default function CourseResultCard({
  course,
  selectedKeys,
  defaultExpanded = false,
  onAddSection,
  onRemoveSection,
  onHover,
  onSetActive,
}: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const { color, bg } = courseColor(course.course_code);

  return (
    <div className="result-card">
      <button
        type="button"
        className="result-card-head"
        onClick={() => setExpanded((open) => !open)}
      >
        <span className="result-dot" style={{ background: color }} />
        <span className="result-card-titles">
          <span className="result-card-codeline">
            <span className="result-card-code">{course.course_code}</span>
            {course.credit && <span className="result-card-credits">{course.credit}cr</span>}
          </span>
          <span className="result-card-title">{course.title}</span>
        </span>
        <span className="result-caret">{expanded ? '▾' : '▸'}</span>
      </button>

      {expanded && (
        <div className="result-card-body">
          <p className="result-desc">
            {course.description || 'No course description is available in the database.'}
            {course.requirements && (
              <span className="result-desc-prereq"> · Prereq {course.requirements}</span>
            )}
          </p>
          {course.sections.map((section) => {
            const key = sectionKey(section);
            const isSelected = selectedKeys.has(key);
            const seat = section.available_seat ?? '?';
            return (
              <div
                key={key}
                className="section-row"
                style={{
                  background: isSelected ? bg : '#faf8f4',
                  border: `1px solid ${isSelected ? `${color}55` : '#f1ece2'}`,
                }}
                data-section-key={key}
                onMouseEnter={() => onHover(key)}
                onMouseLeave={() => onHover(null)}
                onClick={() => onSetActive(key)}
              >
                <span className="section-tag" style={{ background: bg, color }}>
                  {section.class_title || 'SEC'}
                </span>
                <span className="section-row-main">
                  <span className="section-row-time">
                    {formatDayTime(section) || 'No time data'}
                  </span>
                  <span className="section-row-meta">
                    #{section.class_id} · seat {seat}
                  </span>
                </span>
                <button
                  type="button"
                  className="section-add-btn"
                  style={
                    isSelected
                      ? { background: color, borderColor: color }
                      : undefined
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isSelected) onRemoveSection(key);
                    else onAddSection(section);
                  }}
                >
                  {isSelected ? 'Added' : 'Add'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
