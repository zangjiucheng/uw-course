import CourseCard from './CourseCard';
import type { CourseResult, Section } from '../types';
import { sectionKey } from '../utils/schedule';

interface Props {
  results: CourseResult[];
  selections: Section[];
  hoveredSectionKey: string | null;
  activeSectionKey: string | null;
  onAddSection: (section: Section) => void;
  onRemoveSection: (key: string) => void;
  onHover: (key: string | null) => void;
  onSetActive: (key: string) => void;
}

export default function CourseSearch({
  results,
  selections,
  hoveredSectionKey,
  activeSectionKey,
  onAddSection,
  onRemoveSection,
  onHover,
  onSetActive,
}: Props) {
  const selectedKeys = new Set(selections.map(sectionKey));

  return (
    <section className="panel panel-results">
      <div className="panel-header">
        <h2>Course Search</h2>
      </div>
      {results.length === 0 ? (
        <div className="panel-scroll results empty-state">
          Choose a term and search for a course.
        </div>
      ) : (
        <div className="panel-scroll results">
          {results.map((course) => (
            <CourseCard
              key={course.course_code}
              course={course}
              selectedKeys={selectedKeys}
              hoveredSectionKey={hoveredSectionKey}
              activeSectionKey={activeSectionKey}
              onAddSection={onAddSection}
              onRemoveSection={onRemoveSection}
              onHover={onHover}
              onSetActive={onSetActive}
            />
          ))}
        </div>
      )}
    </section>
  );
}
