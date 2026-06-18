import { useState, useRef, useEffect } from 'react';
import type { CourseResult, Section } from '../types';
import { sectionKey } from '../utils/schedule';

interface Props {
  course: CourseResult;
  selectedKeys: Set<string>;
  hoveredSectionKey: string | null;
  activeSectionKey: string | null;
  onAddSection: (section: Section) => void;
  onRemoveSection: (key: string) => void;
  onHover: (key: string | null) => void;
  onSetActive: (key: string) => void;
}

export default function CourseCard({
  course,
  selectedKeys,
  hoveredSectionKey,
  activeSectionKey,
  onAddSection,
  onRemoveSection,
  onHover,
  onSetActive,
}: Props) {
  const [collapsed, setCollapsed] = useState(true);
  const [showToggle, setShowToggle] = useState(false);
  const descRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (descRef.current) {
      setShowToggle(descRef.current.scrollHeight > descRef.current.clientHeight + 2);
    }
  }, [course.description]);

  return (
    <article className="course-card">
      <div className="course-heading">
        <div>
          <h3 className="course-code">{course.course_code}</h3>
          <p className="course-meta">
            {course.section_count} sections · {course.timed_section_count} with time
          </p>
        </div>
      </div>
      <p ref={descRef} className={`course-description${collapsed ? ' is-collapsed' : ''}`}>
        {course.description || 'No course description is available in the database.'}
      </p>
      {showToggle && (
        <button
          type="button"
          className="course-description-toggle secondary"
          onClick={() => setCollapsed((c) => !c)}
        >
          {collapsed ? 'Show more' : 'Show less'}
        </button>
      )}
      {course.requirements && (
        <p className="course-requirements">Prereq: {course.requirements}</p>
      )}
      <div className="section-list">
        {course.sections.map((section) => {
          const key = sectionKey(section);
          const isSelected = selectedKeys.has(key);
          const meta = section.raw_time
            ? `${section.class_title} · ${section.raw_time} · seat ${section.available_seat ?? '?'}`
            : `${section.class_title} · no time data · seat ${section.available_seat ?? '?'}`;
          return (
            <div
              key={key}
              className={`section-chip${hoveredSectionKey === key ? ' is-hovered' : ''}${activeSectionKey === key ? ' is-active' : ''}`}
              data-section-key={key}
              onMouseEnter={() => onHover(key)}
              onMouseLeave={() => onHover(null)}
              onClick={() => onSetActive(key)}
            >
              <div>
                <strong>#{section.class_id}</strong>
                <p>{meta}</p>
              </div>
              <button
                type="button"
                className={isSelected ? 'danger' : ''}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isSelected) onRemoveSection(key);
                  else onAddSection(section);
                }}
              >
                {isSelected ? 'Remove Section' : 'Add Section'}
              </button>
            </div>
          );
        })}
      </div>
    </article>
  );
}
