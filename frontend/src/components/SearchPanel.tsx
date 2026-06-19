import { useState, type FormEvent } from 'react';
import CourseResultCard from './CourseResultCard';
import type { CourseResult, Section } from '../types';
import { sectionKey } from '../utils/schedule';

interface Props {
  term: string;
  results: CourseResult[];
  selections: Section[];
  onSearch: (query: string) => void;
  onAddSection: (section: Section) => void;
  onRemoveSection: (key: string) => void;
  onHover: (key: string | null) => void;
  onSetActive: (key: string) => void;
}

export default function SearchPanel({
  term,
  results,
  selections,
  onSearch,
  onAddSection,
  onRemoveSection,
  onHover,
  onSetActive,
}: Props) {
  const [query, setQuery] = useState('');
  const selectedKeys = new Set(selections.map(sectionKey));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <aside className="search-panel">
      <div className="search-panel-head">
        <form className="search-field" onSubmit={handleSubmit}>
          <span className="search-field-icon">⌕</span>
          <input
            type="text"
            placeholder="Search CS 341, probability…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
        <div className="search-meta">
          <span className="search-meta-count">{results.length} courses</span>
          <span className="search-meta-note">{term ? `${term} · live data` : 'live data'}</span>
        </div>
      </div>

      <div className="search-results">
        {results.length === 0 ? (
          <div className="empty-note">
            Search a course code or title to begin.
            <br />
            Press Enter to run the search.
          </div>
        ) : (
          results.map((course, index) => (
            <CourseResultCard
              key={course.course_code}
              course={course}
              selectedKeys={selectedKeys}
              defaultExpanded={results.length === 1 || index === 0}
              onAddSection={onAddSection}
              onRemoveSection={onRemoveSection}
              onHover={onHover}
              onSetActive={onSetActive}
            />
          ))
        )}
      </div>
    </aside>
  );
}
