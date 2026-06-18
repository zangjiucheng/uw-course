import { useState } from 'react';

const GOOSE_IMAGES = [
  'https://uwaterloo.ca/support/sites/default/files/styles/uw_is_media_x_large/public/uploads/images/finalist-3.png?itok=D1PdGsZQ',
  'https://uwaterloo.ca/support/sites/default/files/styles/uw_is_media_x_large/public/uploads/images/finalist-1.png?itok=EblnWhUY',
  'https://uwaterloo.ca/support/sites/default/files/styles/uw_is_media_x_large/public/uploads/images/finalist-4_0.png?itok=JOAWl5aE',
  'https://uwaterloo.ca/support/sites/default/files/styles/uw_is_media_x_large/public/uploads/images/honourable-mention-1.png?itok=xkEtLx_a',
  'https://uwaterloo.ca/support/sites/default/files/styles/uw_is_media_x_large/public/uploads/images/honourable-mention-2.png?itok=zHTAAvB_',
  'https://uwaterloo.ca/support/sites/default/files/styles/uw_is_media_x_large/public/uploads/images/honourable-mention-3.png?itok=mvNl9_NX',
  'https://uwaterloo.ca/support/sites/default/files/styles/uw_is_media_x_large/public/uploads/images/honourable-mention-4.png?itok=xeerJOPM',
];

interface GooseSprite {
  id: number;
  image: string;
  size: number;
  duration: number;
  delay: number;
  left: number;
}

interface Props {
  onToast: (message: string) => void;
}

let nextId = 0;
let totalCount = 0;

export default function GooseEasterEgg({ onToast }: Props) {
  const [geese, setGeese] = useState<GooseSprite[]>([]);

  function releaseGoose() {
    const burstSize = 8 + Math.floor(Math.random() * 5);
    const newGeese: GooseSprite[] = [];

    for (let i = 0; i < burstSize; i++) {
      const duration = 3.8 + Math.random() * 2.8;
      const delay = Math.random() * 0.9;
      const id = ++nextId;
      newGeese.push({
        id,
        image: GOOSE_IMAGES[Math.floor(Math.random() * GOOSE_IMAGES.length)],
        size: 72 + Math.floor(Math.random() * 48),
        duration,
        delay,
        left: 4 + Math.random() * 88,
      });
      setTimeout(() => {
        setGeese((prev) => prev.filter((g) => g.id !== id));
      }, (duration + delay) * 1000 + 400);
    }

    setGeese((prev) => [...prev, ...newGeese]);
    totalCount += burstSize;
    onToast(
      totalCount % 16 === 0 ? 'Goose storm unlocked.' : 'Honk. Goose rain activated.'
    );
  }

  return (
    <>
      <div className="goose-cluster">
        <a
          className="goose-credit"
          href="https://uwaterloo.ca/support/2024-uwaterloo-fsr-drawing-contest"
          target="_blank"
          rel="noreferrer"
        >
          Goose artwork credit
        </a>
        <button
          type="button"
          className="goose-button"
          aria-label="Release the goose"
          onClick={releaseGoose}
        >
          <img src={GOOSE_IMAGES[0]} alt="Canada goose easter egg" />
        </button>
      </div>
      <div className="goose-stage" aria-hidden="true">
        {geese.map((goose) => (
          <img
            key={goose.id}
            className="goose-sprite"
            src={goose.image}
            alt=""
            style={{
              left: `${goose.left}vw`,
              width: `${goose.size}px`,
              height: `${goose.size}px`,
              animationDuration: `${goose.duration}s`,
              animationDelay: `${goose.delay}s`,
            }}
          />
        ))}
      </div>
    </>
  );
}
