import type { Section } from '../types';

interface Props {
  section: Section | null;
}

export default function ActiveSectionPanel({ section }: Props) {
  if (!section) return null;

  return (
    <div className="active-section-panel">
      <h3>
        {section.course_code} · {section.class_title}
      </h3>
      <p>{section.raw_time || 'No time data available'}</p>
      <div className="active-section-meta">
        <span className="active-section-pill">Class #{section.class_id}</span>
        <span className="active-section-pill">Seats {section.available_seat ?? '?'}</span>
        <span className="active-section-pill">{section.days?.join(', ') || 'Unscheduled'}</span>
      </div>
    </div>
  );
}
