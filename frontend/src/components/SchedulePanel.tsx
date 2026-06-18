import { useRef, useState } from 'react';
import SelectionList from './SelectionList';
import ActiveSectionPanel from './ActiveSectionPanel';
import ConflictBar from './ConflictBar';
import TimetableView from './TimetableView';
import ExplorerView from './ExplorerView';
import type { Section, CourseResult, SchedulePayload } from '../types';
import {
  computeConflictEntries,
  computeConflictMap,
} from '../utils/schedule';

interface HoverCard {
  section: Section;
  left: number;
  top: number;
}

interface Props {
  payload: SchedulePayload;
  selections: Section[];
  searchResults: CourseResult[];
  scheduleView: 'timetable' | 'explorer';
  hoveredSectionKey: string | null;
  activeSectionKey: string | null;
  activeSection: Section | null;
  hoveredSection: Section | null;
  onSetView: (view: 'timetable' | 'explorer') => void;
  onAddSection: (section: Section) => void;
  onRemoveSection: (key: string) => void;
  onHover: (key: string | null) => void;
  onSetActive: (key: string) => void;
}

export default function SchedulePanel({
  payload,
  selections,
  searchResults,
  scheduleView,
  hoveredSectionKey,
  activeSectionKey,
  activeSection,
  hoveredSection,
  onSetView,
  onAddSection,
  onRemoveSection,
  onHover,
  onSetActive,
}: Props) {
  const scheduleBodyRef = useRef<HTMLDivElement>(null);
  const [hoverCard, setHoverCard] = useState<HoverCard | null>(null);

  const items = payload.items || [];
  const timedCount = items.filter(
    (s) => s.days?.length && s.start_time && s.end_time
  ).length;
  const conflicts = computeConflictEntries(items);
  const conflictMap = computeConflictMap(items);

  function handleBlockMouseEnter(section: Section, event: React.MouseEvent<HTMLDivElement>) {
    const body = scheduleBodyRef.current;
    if (!body) return;
    const bodyRect = body.getBoundingClientRect();
    const anchorRect = event.currentTarget.getBoundingClientRect();
    const cardWidth = 240;
    const cardHeight = 132;
    const gap = 10;
    const scrollLeft = body.scrollLeft;
    const scrollTop = body.scrollTop;

    let left = anchorRect.right - bodyRect.left + scrollLeft + gap;
    let top = anchorRect.top - bodyRect.top + scrollTop;

    if (left + cardWidth > scrollLeft + bodyRect.width - 8) {
      left = anchorRect.left - bodyRect.left + scrollLeft - cardWidth - gap;
    }
    if (top + cardHeight > scrollTop + bodyRect.height - 8) {
      top = scrollTop + bodyRect.height - cardHeight - 8;
    }
    if (top < scrollTop + 8) top = scrollTop + 8;
    if (left < scrollLeft + 8) left = scrollLeft + 8;

    setHoverCard({ section, left, top });
  }

  function handleBlockMouseLeave() {
    setHoverCard(null);
  }

  return (
    <section className="panel panel-schedule">
      <section className="panel-inline panel-plan-inline">
        <div className="panel-header">
          <h2>Selected Sections</h2>
        </div>
        <SelectionList
          selections={selections}
          hoveredSectionKey={hoveredSectionKey}
          activeSectionKey={activeSectionKey}
          onRemove={onRemoveSection}
          onHover={onHover}
          onSetActive={onSetActive}
        />
      </section>

      <div className="panel-header">
        <h2>Weekly View</h2>
      </div>

      <div className="schedule-topbar">
        <div className="schedule-stats">
          <span className="schedule-stat">
            <strong>{selections.length}</strong> selected
          </span>
          <span className="schedule-stat">
            <strong>{timedCount}</strong> timed
          </span>
          <span
            className={
              conflicts.length ? 'schedule-stat schedule-stat-conflict' : 'schedule-stat'
            }
          >
            <strong>{conflicts.length}</strong> conflicts
          </span>
        </div>
        <div className="schedule-tabs">
          <button
            type="button"
            className={`schedule-tab${scheduleView === 'timetable' ? ' active' : ''}`}
            onClick={() => onSetView('timetable')}
          >
            Timetable
          </button>
          <button
            type="button"
            className={`schedule-tab${scheduleView === 'explorer' ? ' active' : ''}`}
            onClick={() => onSetView('explorer')}
          >
            Section Explorer
          </button>
        </div>
      </div>

      {activeSection && <ActiveSectionPanel section={activeSection} />}
      {conflicts.length > 0 && <ConflictBar conflicts={conflicts} />}

      <div className="schedule-body" ref={scheduleBodyRef}>
        {scheduleView === 'timetable' ? (
          <TimetableView
            payload={payload}
            hoveredSection={hoveredSection}
            hoveredSectionKey={hoveredSectionKey}
            activeSectionKey={activeSectionKey}
            conflictMap={conflictMap}
            onHoverSection={onHover}
            onSetActive={onSetActive}
            onBlockMouseEnter={handleBlockMouseEnter}
            onBlockMouseLeave={handleBlockMouseLeave}
          />
        ) : (
          <ExplorerView
            searchResults={searchResults}
            scheduleItems={items}
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
        {hoverCard && scheduleView === 'timetable' && (
          <div
            className="timetable-hover-card"
            style={{ left: `${hoverCard.left}px`, top: `${hoverCard.top}px` }}
          >
            <h3>
              {hoverCard.section.course_code} · {hoverCard.section.class_title}
            </h3>
            <p>{hoverCard.section.raw_time || 'No time data available'}</p>
            <div className="timetable-hover-meta">
              <span className="timetable-hover-pill">
                Class #{hoverCard.section.class_id}
              </span>
              <span className="timetable-hover-pill">
                Seats {hoverCard.section.available_seat ?? '?'}
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
