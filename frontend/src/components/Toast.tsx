interface Props {
  message: string;
}

export default function Toast({ message }: Props) {
  return <div className="status-toast">{message}</div>;
}
