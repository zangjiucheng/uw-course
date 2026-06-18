import { useState, useCallback, useEffect } from 'react';
import Hero from './components/Hero';
import PlanTools from './components/PlanTools';
import CourseSearch from './components/CourseSearch';
import SchedulePanel from './components/SchedulePanel';
import GooseEasterEgg from './components/GooseEasterEgg';
import Toast from './components/Toast';
import { api } from './api';
import type { Section, CourseResult, SchedulePayload, Toast as ToastType } from './types';
import { sectionKey } from './utils/schedule';

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
      try {
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
            `Imported locked sections. ${skipped} course-only line(s) were skipped; use Auto Resolve Courses for those.`
          );
        } else {
          showToast('Plan imported.');
        }
      } catch (err: unknown) {
        showToast((err as Error).message);
      }
    },
    [refreshSchedule, showToast]
  );

  const handleAutoResolve = useCallback(
    async (planText: string) => {
      try {
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
      } catch (err: unknown) {
        showToast((err as Error).message);
      }
    },
    [showToast]
  );

  const handleExportPlan = useCallback(async () => {
    try {
      const { plan_text } = await api.exportPlan(
        term,
        selections.map((s) => ({ course_code: s.course_code, class_id: s.class_id }))
      );
      await navigator.clipboard.writeText(plan_text);
      showToast('Plan text copied to the clipboard.');
    } catch (err: unknown) {
      showToast((err as Error).message);
    }
  }, [term, selections, showToast]);

  const allSections = [
    ...(schedulePayload.items || []),
    ...searchResults.flatMap((c) => c.sections),
    ...selections,
  ];
  const activeSection = activeSectionKey
    ? (allSections.find((s) => sectionKey(s) === activeSectionKey) ?? null)
    : null;
  const hoveredSection = hoveredSectionKey
    ? (allSections.find((s) => sectionKey(s) === hoveredSectionKey) ?? null)
    : null;

  return (
    <div className="page-shell">
      <Hero
        terms={terms}
        term={term}
        onTermChange={handleTermChange}
        onSearch={handleSearch}
      />
      <main className="dashboard">
        <aside className="dashboard-sidebar">
          <PlanTools
            onImport={handleImportPlan}
            onAutoResolve={handleAutoResolve}
            onExport={handleExportPlan}
          />
          <CourseSearch
            results={searchResults}
            selections={selections}
            hoveredSectionKey={hoveredSectionKey}
            activeSectionKey={activeSectionKey}
            onAddSection={addSelection}
            onRemoveSection={removeSelection}
            onHover={setHoveredSectionKey}
            onSetActive={handleSetActive}
          />
        </aside>
        <SchedulePanel
          payload={schedulePayload}
          selections={selections}
          searchResults={searchResults}
          scheduleView={scheduleView}
          hoveredSectionKey={hoveredSectionKey}
          activeSectionKey={activeSectionKey}
          activeSection={activeSection}
          hoveredSection={hoveredSection}
          onSetView={setScheduleView}
          onAddSection={addSelection}
          onRemoveSection={removeSelection}
          onHover={setHoveredSectionKey}
          onSetActive={handleSetActive}
        />
      </main>
      <GooseEasterEgg onToast={showToast} />
      {toasts.map((toast) => (
        <Toast key={toast.id} message={toast.message} />
      ))}
    </div>
  );
}
