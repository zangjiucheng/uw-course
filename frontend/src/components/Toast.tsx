interface Props {
  message: string;
}

export default function Toast({ message }: Props) {
  return (
    <div className="toast">
      <span className="toast-check">✓</span>
      {message}
    </div>
  );
}
