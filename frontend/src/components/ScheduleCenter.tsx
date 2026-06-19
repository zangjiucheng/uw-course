import TimetableView from './TimetableView';
import ExplorerView from './ExplorerView';
import type { Section, CourseResult, SchedulePayload } from '../types';

interface Props {
  payload: SchedulePayload;
  selections: Section[];
  searchResults: CourseResult[];
  scheduleView: 'timetable' | 'explorer';
  hoveredSectionKey: string | null;
  activeSectionKey: string | null;
  hoveredSection: Section | null;
  conflictMap: Map<string, Section[]>;
  onAddSection: (section: Section) => void;
  onRemoveSection: (key: string) => void;
  onHover: (key: string | null) => void;
  onSetActive: (key: string) => void;
}

export default function ScheduleCenter({
  payload,
  selections,
  searchResults,
  scheduleView,
  hoveredSectionKey,
  activeSectionKey,
  hoveredSection,
  conflictMap,
  onAddSection,
  onRemoveSection,
  onHover,
  onSetActive,
}: Props) {
  return (
    <main className="schedule-center">
      {scheduleView === 'timetable' ? (
        <TimetableView
          payload={payload}
          hoveredSection={hoveredSection}
          hoveredSectionKey={hoveredSectionKey}
          activeSectionKey={activeSectionKey}
          conflictMap={conflictMap}
          onHoverSection={onHover}
          onSetActive={onSetActive}
        />
      ) : (
        <ExplorerView
          searchResults={searchResults}
          scheduleItems={payload.items || []}
          selections={selections}
          hoveredSectionKey={hoveredSectionKey}
          activeSectionKey={activeSectionKey}
          conflictMap={conflictMap}
          onAddSection={onAddSection}
          onRemoveSection={onRemoveSection}
          onHover={onHover}
          onSetActive={onSetActive}
        />
      )}
    </main>
  );
}
