import { useState, type FormEvent } from 'react';

interface Props {
  terms: string[];
  term: string;
  onTermChange: (term: string) => void;
  onSearch: (query: string) => void;
}

export default function Hero({ terms, term, onTermChange, onSearch }: Props) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <header className="hero">
      <div className="hero-brand">
        <img
          className="hero-brand-icon"
          src="/uw-course-planner-icon.png"
          alt="UW Course Planner goose icon"
        />
        <div>
          <p className="eyebrow">UWaterloo Course Planner</p>
          <h1>Build your Waterloo schedule</h1>
        </div>
      </div>
      <div className="hero-panel">
        <label className="field">
          <span>Term</span>
          <select value={term} onChange={(e) => onTermChange(e.target.value)}>
            {terms.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Search Course</span>
          <form className="search-row" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="e.g. CS 341"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>
        </label>
      </div>
    </header>
  );
}
