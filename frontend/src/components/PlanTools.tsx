import { useState } from 'react';

interface Props {
  onImport: (planText: string) => void;
  onAutoResolve: (planText: string) => void;
  onExport: () => void;
}

const PLACEHOLDER = 'Class2026Spring\n\nCS 341\nMATH 239\nSTAT 230, 1234';

export default function PlanTools({ onImport, onAutoResolve, onExport }: Props) {
  const [planText, setPlanText] = useState('');

  const effective = () => planText.trim() || PLACEHOLDER;

  return (
    <section className="panel panel-tools">
      <div className="panel-header">
        <h2>Plan Tools</h2>
      </div>
      <div className="plan-tools-card plan-tools-card-editor">
        <label className="field plan-tools-field">
          <span>Schedule Plan</span>
          <textarea
            rows={6}
            placeholder={PLACEHOLDER}
            value={planText}
            onChange={(e) => setPlanText(e.target.value)}
          />
        </label>
        <div className="plan-tools-actions">
          <button type="button" onClick={() => onImport(effective())}>
            Import Plan
          </button>
          <button type="button" className="secondary" onClick={() => onAutoResolve(effective())}>
            Auto Resolve Courses
          </button>
          <button type="button" className="secondary" onClick={onExport}>
            Export Current Plan
          </button>
        </div>
      </div>
    </section>
  );
}
