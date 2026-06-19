import { useState, useCallback, useEffect, useRef } from 'react';
import AppHeader from './components/AppHeader';
import SearchPanel from './components/SearchPanel';
import ScheduleCenter from './components/ScheduleCenter';
import PlanPanel from './components/PlanPanel';
import PlanModal, { type PlanModalMode } from './components/PlanModal';
import GooseEasterEgg, { type GooseHandle } from './components/GooseEasterEgg';
import Toast from './components/Toast';
import { api } from './api';
import type { Section, CourseResult, SchedulePayload, Toast as ToastType } from './types';
import { sectionKey, computeConflictEntries, computeConflictMap } from './utils/schedule';

let nextToastId = 0;

const EMPTY_SCHEDULE: SchedulePayload = { term: '', items: [], weekly: {} };

export default function App() {
  const [terms, setTerms] = useState<string[]>([]);
  const [term, setTerm] = useState('');
  const [selections, setSelections] = useState<Section[]>([]);
  const [searchResults, setSearchResults] = useState<CourseResult[]>([]);
  const [schedulePayload, setSchedulePayload] = useState<SchedulePayload>(EMPTY_SCHEDULE);
  const [scheduleView, setScheduleView] = useState<'timetable' | 'explorer'>('timetable');
  const [hoveredSectionKey, setHoveredSectionKey] = useState<string | null>(null);
  const [activeSectionKey, setActiveSectionKey] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastType[]>([]);
  const [modalMode, setModalMode] = useState<PlanModalMode | null>(null);
  const [modalText, setModalText] = useState('');

  const gooseRef = useRef<GooseHandle>(null);

  const showToast = useCallback((message: string) => {
    const id = ++nextToastId;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2600);
  }, []);

  const refreshSchedule = useCallback(
    async (currentTerm: string, currentSelections: Section[]) => {
      const payload = await api.buildSchedule(
        currentTerm,
        currentSelections.map((s) => ({ course_code: s.course_code, class_id: s.class_id }))
      );
      setSchedulePayload(payload);
    },
    []
  );

  useEffect(() => {
    api
      .getTerms()
      .then(({ terms: t }) => {
        setTerms(t);
        const first = t[0] || '';
        setTerm(first);
        return refreshSchedule(first, []);
      })
      .catch((err: Error) => showToast(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTermChange = useCallback(
    (newTerm: string) => {
      setTerm(newTerm);
      setSearchResults([]);
      refreshSchedule(newTerm, selections).catch((err: Error) => showToast(err.message));
    },
    [selections, refreshSchedule, showToast]
  );

  const handleSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        showToast('Enter a course code.');
        return;
      }
      try {
        const { results } = await api.searchCourses(term, query);
        setSearchResults(results);
      } catch (err: unknown) {
        showToast((err as Error).message);
      }
    },
    [term, showToast]
  );

  const addSelection = useCallback(
    async (section: Section) => {
      if (selections.some((s) => s.class_id === section.class_id)) {
        showToast('That section is already in the plan.');
        return;
      }
      const next = [...selections, section];
      setSelections(next);
      setActiveSectionKey(sectionKey(section));
      try {
        await refreshSchedule(term, next);
      } catch (err: unknown) {
        showToast((err as Error).message);
      }
    },
    [selections, term, refreshSchedule, showToast]
  );

  const removeSelection = useCallback(
    async (key: string) => {
      const next = selections.filter((s) => sectionKey(s) !== key);
      setSelections(next);
      if (activeSectionKey === key) {
        setActiveSectionKey(next[0] ? sectionKey(next[0]) : null);
      }
      try {
        await refreshSchedule(term, next);
      } catch (err: unknown) {
        showToast((err as Error).message);
      }
    },
    [selections, activeSectionKey, term, refreshSchedule, showToast]
  );

  const focusCourseInSearch = useCallback(
    async (courseCode: string) => {
      if (!courseCode || !term) return;
      const payload = await api.getCourse(term, courseCode);
      const sections = payload.sections || [];
      setSearchResults([
        {
          ...payload,
          title: payload.title || courseCode,
          credit: payload.credit || '',
          description: payload.description || '',
          requirements: payload.requirements || '',
          section_count: sections.length,
          timed_section_count: sections.filter((s) => s.days?.length && s.start_time).length,
        },
      ]);
    },
    [term]
  );

  const handleSetActive = useCallback(
    (key: string) => {
      setActiveSectionKey(key);
      const allSections = [
        ...(schedulePayload.items || []),
        ...searchResults.flatMap((c) => c.sections),
        ...selections,
      ];
      const sec = allSections.find((s) => sectionKey(s) === key);
      if (sec) {
        focusCourseInSearch(sec.course_code).catch((err: Error) => showToast(err.message));
      }
    },
    [schedulePayload.items, searchResults, selections, focusCourseInSearch, showToast]
  );

  const handleImportPlan = useCallback(
    async (planText: string) => {
      const parsed = await api.parsePlan(planText);
      const newTerm = parsed.term;
      setTerm(newTerm);
      setSearchResults([]);

      const newSelections: Section[] = [];
      let skipped = 0;
      for (const sel of parsed.selections) {
        if (sel.class_id == null) {
          skipped++;
          continue;
        }
        const coursePayload = await api.getCourse(newTerm, sel.course_code);
        const matching = coursePayload.sections.find((s) => s.class_id === sel.class_id);
        if (matching) newSelections.push(matching);
      }

      setSelections(newSelections);
      setActiveSectionKey(newSelections[0] ? sectionKey(newSelections[0]) : null);
      await refreshSchedule(newTerm, newSelections);

      if (skipped > 0) {
        showToast(
          `Imported locked sections. ${skipped} course-only line(s) skipped; use Auto-resolve for those.`
        );
      } else {
        showToast('Plan imported.');
      }
    },
    [refreshSchedule, showToast]
  );

  const handleAutoResolve = useCallback(
    async (planText: string) => {
      const payload = await api.resolvePlan(planText);
      const resolved = payload.resolved_items || [];
      setTerm(payload.term);
      setSelections(resolved);
      setActiveSectionKey(resolved[0] ? sectionKey(resolved[0]) : null);
      setSearchResults([]);
      setSchedulePayload(payload);

      const unresolvedCount = (payload.unresolved_courses || []).length;
      const autoCount = (payload.auto_resolved_courses || []).length;
      if (unresolvedCount > 0) {
        const summary = (payload.unresolved_courses || [])
          .slice(0, 2)
          .map((item) => item.course_code)
          .join(', ');
        showToast(
          `Auto-resolved ${autoCount} course(s). ${unresolvedCount} could not be resolved${
            summary ? `: ${summary}` : ''
          }.`
        );
      } else {
        showToast(`Auto-resolved ${autoCount} course(s).`);
      }
    },
    [showToast]
  );

  const openModal = useCallback((mode: PlanModalMode) => {
    setModalText('');
    setModalMode(mode);
  }, []);

  const openExport = useCallback(async () => {
    try {
      const { plan_text } = await api.exportPlan(
        term,
        selections.map((s) => ({ course_code: s.course_code, class_id: s.class_id }))
      );
      setModalText(plan_text);
      setModalMode('export');
    } catch (err: unknown) {
      showToast((err as Error).message);
    }
  }, [term, selections, showToast]);

  const handleModalSubmit = useCallback(async () => {
    if (modalMode === 'export') {
      try {
        await navigator.clipboard.writeText(modalText);
        showToast('Plan text copied to the clipboard.');
        setModalMode(null);
      } catch (err: unknown) {
        showToast((err as Error).message);
      }
      return;
    }

    if (!modalText.trim()) {
      showToast('Enter some plan text first.');
      return;
    }

    try {
      if (modalMode === 'import') await handleImportPlan(modalText);
      else if (modalMode === 'resolve') await handleAutoResolve(modalText);
      setModalMode(null);
    } catch (err: unknown) {
      showToast((err as Error).message);
    }
  }, [modalMode, modalText, handleImportPlan, handleAutoResolve, showToast]);

  const allSections = [
    ...(schedulePayload.items || []),
    ...searchResults.flatMap((c) => c.sections),
    ...selections,
  ];
  const hoveredSection = hoveredSectionKey
    ? (allSections.find((s) => sectionKey(s) === hoveredSectionKey) ?? null)
    : null;

  const conflicts = computeConflictEntries(schedulePayload.items || []);
  const conflictMap = computeConflictMap(schedulePayload.items || []);

  return (
    <div className="app-shell">
      <AppHeader
        terms={terms}
        term={term}
        onTermChange={handleTermChange}
        view={scheduleView}
        onSetView={setScheduleView}
        selectedCount={selections.length}
        conflictCount={conflicts.length}
        onAutoResolve={() => openModal('resolve')}
        onPlanText={() => openModal('import')}
        onGoose={() => gooseRef.current?.release()}
      />

      <div className="app-body">
        <SearchPanel
          term={term}
          results={searchResults}
          selections={selections}
          onSearch={handleSearch}
          onAddSection={addSelection}
          onRemoveSection={removeSelection}
          onHover={setHoveredSectionKey}
          onSetActive={handleSetActive}
        />

        <ScheduleCenter
          payload={schedulePayload}
          selections={selections}
          searchResults={searchResults}
          scheduleView={scheduleView}
          hoveredSectionKey={hoveredSectionKey}
          activeSectionKey={activeSectionKey}
          hoveredSection={hoveredSection}
          conflictMap={conflictMap}
          onAddSection={addSelection}
          onRemoveSection={removeSelection}
          onHover={setHoveredSectionKey}
          onSetActive={handleSetActive}
        />

        <PlanPanel
          selections={selections}
          conflicts={conflicts}
          hoveredSectionKey={hoveredSectionKey}
          activeSectionKey={activeSectionKey}
          onRemove={removeSelection}
          onHover={setHoveredSectionKey}
          onSetActive={handleSetActive}
          onExport={openExport}
        />
      </div>

      {modalMode && (
        <PlanModal
          mode={modalMode}
          text={modalText}
          onTextChange={setModalText}
          onSubmit={handleModalSubmit}
          onClose={() => setModalMode(null)}
        />
      )}

      <GooseEasterEgg ref={gooseRef} onToast={showToast} />

      {toasts.length > 0 && (
        <div className="toast-stack">
          {toasts.map((toast) => (
            <Toast key={toast.id} message={toast.message} />
          ))}
        </div>
      )}
    </div>
  );
}
