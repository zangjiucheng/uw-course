import type { ConflictEntry } from '../utils/schedule';
import { DAY_LABELS } from '../utils/schedule';

interface Props {
  conflicts: ConflictEntry[];
}

export default function ConflictBar({ conflicts }: Props) {
  if (!conflicts.length) return null;

  return (
    <div className="conflict-bar">
      <div className="conflict-list">
        {conflicts.map((entry, i) => (
          <div key={i}>
            <strong>{DAY_LABELS[entry.day]}</strong>
            {' · '}
            {entry.first.start_time}-{entry.first.end_time} overlaps {entry.first.course_code} #
            {entry.first.class_id} with {entry.second.course_code} #{entry.second.class_id}
          </div>
        ))}
      </div>
    </div>
  );
}
