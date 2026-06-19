interface Props {
  size?: number;
  /** "dark" body for light backgrounds, "light" body for dark backgrounds. */
  tone?: 'dark' | 'light';
}

export default function GooseMark({ size = 20, tone = 'dark' }: Props) {
  const body = tone === 'dark' ? '#19140f' : '#fffdf9';
  const eye = tone === 'dark' ? '#fff' : '#19140f';
  const beak = tone === 'dark' ? '#19140f' : '#f59e0b';

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14.5 4.2c-1.7 0-3 1.2-3 2.9 0 .5.1.9.3 1.3-2.6.7-5 2.9-5.8 6.2-.3 1.4-.4 2.1-1.6 3.2-.7.6-.3 1.8.7 1.8h7.8c3.1 0 5.4-2.5 5.4-5.6V8.3c0-2.3-1.6-4.1-3.9-4.1z"
        fill={body}
      />
      <circle cx="14.8" cy="6.8" r="1" fill={eye} />
      <path d="M11.5 7.3 8.7 8.1c-.5.1-.5.8 0 .9l2.8.6" fill={beak} />
    </svg>
  );
}
