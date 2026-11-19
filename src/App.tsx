import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Sparkles, Clock, Trophy, HelpCircle } from 'lucide-react';
import './App.css';

interface ColorOption {
  id: string;
  hex: string;
  targetIndex: number;
  name: string;
}

const TARGET_COLORS: { hex: string; name: string }[] = [
  { hex: '#FF4B5C', name: 'あか' },
  { hex: '#FF9A3C', name: 'オレンジ' },
  { hex: '#FFD93D', name: 'きいろ' },
  { hex: '#6BCB77', name: 'みどり' },
  { hex: '#4D96FF', name: 'みずいろ' },
  { hex: '#3B44F6', name: 'あお' },
  { hex: '#9B5DE5', name: 'むらさき' },
];

const PALETTE_DATA: Omit<ColorOption, 'id'>[] = [
  // Reds
  { hex: '#FF4B5C', targetIndex: 0, name: 'あか（正解）' },
  { hex: '#E03142', targetIndex: -1, name: 'こいあか' },
  { hex: '#FF7582', targetIndex: -1, name: 'うすあか' },
  { hex: '#FF5E4B', targetIndex: -1, name: 'しゅいろ' },
  { hex: '#D9385A', targetIndex: -1, name: 'えんじ' },

  // Oranges
  { hex: '#FF9A3C', targetIndex: 1, name: 'オレンジ（正解）' },
  { hex: '#E67E22', targetIndex: -1, name: 'こいオレンジ' },
  { hex: '#FFB36B', targetIndex: -1, name: 'うすオレンジ' },
  { hex: '#FF7B29', targetIndex: -1, name: 'みかんいろ' },
  { hex: '#F39C12', targetIndex: -1, name: 'やまぶき' },

  // Yellows
  { hex: '#FFD93D', targetIndex: 2, name: 'きいろ（正解）' },
  { hex: '#F4C430', targetIndex: -1, name: 'こいきいろ' },
  { hex: '#FFE680', targetIndex: -1, name: 'うすきいろ' },
  { hex: '#E5E53B', targetIndex: -1, name: 'レモン' },
  { hex: '#FFC107', targetIndex: -1, name: 'たまごいろ' },

  // Greens
  { hex: '#6BCB77', targetIndex: 3, name: 'みどり（正解）' },
  { hex: '#4CAF50', targetIndex: -1, name: 'こいみどり' },
  { hex: '#95E19E', targetIndex: -1, name: 'うすみどり' },
  { hex: '#8BC34A', targetIndex: -1, name: 'きみどり' },
  { hex: '#38A169', targetIndex: -1, name: 'ふかみどり' },

  // Light Blues
  { hex: '#4D96FF', targetIndex: 4, name: 'みずいろ（正解）' },
  { hex: '#2B7DE9', targetIndex: -1, name: 'こいみずいろ' },
  { hex: '#82B6FF', targetIndex: -1, name: 'うすみずいろ' },
  { hex: '#38BDF8', targetIndex: -1, name: 'そらいろ' },
  { hex: '#00B4D8', targetIndex: -1, name: 'ターコイズ' },

  // Blues
  { hex: '#3B44F6', targetIndex: 5, name: 'あお（正解）' },
  { hex: '#252DC2', targetIndex: -1, name: 'こいあお' },
  { hex: '#6C73FF', targetIndex: -1, name: 'うすあお' },
  { hex: '#1D4ED8', targetIndex: -1, name: 'ぐんじょう' },
  { hex: '#4F46E5', targetIndex: -1, name: 'あいいろ' },

  // Violets
  { hex: '#9B5DE5', targetIndex: 6, name: 'むらさき（正解）' },
  { hex: '#7B3FC4', targetIndex: -1, name: 'こいむらさき' },
  { hex: '#B988F5', targetIndex: -1, name: 'うすむらさき' },
  { hex: '#C026D3', targetIndex: -1, name: 'あかむらさき' },
  { hex: '#8B5CF6', targetIndex: -1, name: 'ふじいろ' },
];

function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

interface ConfettiPiece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
  rotation: number;
}

export default function App() {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'cleared' | 'gameover'>('start');
  const [timeLeft, setTimeLeft] = useState<number>(90);
  const [filledBands, setFilledBands] = useState<boolean[]>(Array(7).fill(false));
  const [palette, setPalette] = useState<ColorOption[]>([]);
  const [feedback, setFeedback] = useState<{ text: string; type: 'good' | 'bad' | 'hint' } | null>(null);
  const [catProgress, setCatProgress] = useState<number>(0);
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [showSample, setShowSample] = useState<boolean>(false);

  const [draggedColor, setDraggedColor] = useState<ColorOption | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const startPointerRef = useRef<{ x: number; y: number; color: ColorOption } | null>(null);

  const initializeGame = () => {
    const shuffled = shuffleArray(PALETTE_DATA).map((item, idx) => ({
      ...item,
      id: `color-${idx}-${Math.random().toString(36).substring(2, 7)}`,
    }));
    setPalette(shuffled);
    setFilledBands(Array(7).fill(false));
    setTimeLeft(90);
    setCatProgress(0);
    setFeedback(null);
    setConfetti([]);
    setGameState('playing');
  };

  useEffect(() => {
    if (gameState !== 'playing') return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameState('gameover');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'cleared') return;

    const pieces: ConfettiPiece[] = Array.from({ length: 55 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2.2 + Math.random() * 2,
      size: 8 + Math.random() * 10,
      color: ['#FFD700', '#FDB931', '#FFF099', '#DAA520', '#FFE875'][Math.floor(Math.random() * 5)],
      rotation: Math.random() * 360,
    }));
    setConfetti(pieces);

    let start: number | null = null;
    const duration = 2600;
    let animId: number;

    const animateCat = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCatProgress(eased);
      if (progress < 1) {
        animId = requestAnimationFrame(animateCat);
      }
    };
    animId = requestAnimationFrame(animateCat);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  const showTempFeedback = (text: string, type: 'good' | 'bad' | 'hint') => {
    setFeedback({ text, type });
    setTimeout(() => {
      setFeedback((prev) => (prev?.text === text ? null : prev));
    }, 1200);
  };

  const handleSelectColor = (option: ColorOption) => {
    if (gameState !== 'playing') return;

    if (option.targetIndex !== -1) {
      if (filledBands[option.targetIndex]) {
        showTempFeedback('その色はもう入ってるにゃ！', 'hint');
        return;
      }
      const nextBands = [...filledBands];
      nextBands[option.targetIndex] = true;
      setFilledBands(nextBands);
      showTempFeedback(`✨ ${TARGET_COLORS[option.targetIndex].name} がぴったり！`, 'good');

      if (nextBands.every(Boolean)) {
        setGameState('cleared');
      }
    } else {
      showTempFeedback('おしい！ちょっと違う色みたい…', 'bad');
    }
  };

  const handlePointerDown = (e: React.PointerEvent, option: ColorOption) => {
    if (gameState !== 'playing') return;
    startPointerRef.current = { x: e.clientX, y: e.clientY, color: option };
    setDraggedColor(option);
    setDragPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!startPointerRef.current) return;
    setDragPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!startPointerRef.current) return;
    const { x, y, color } = startPointerRef.current;
    const dx = e.clientX - x;
    const dy = e.clientY - y;
    const distance = Math.hypot(dx, dy);

    if (distance < 15 || dy < -25) {
      handleSelectColor(color);
    }

    startPointerRef.current = null;
    setDraggedColor(null);
    setDragPos(null);
  };

  const arcCenterX = 360;
  const arcCenterY = 260;
  const walkRadius = 215;
  const startAngleDeg = 176;
  const endAngleDeg = 104;
  const currentAngleDeg = startAngleDeg - (startAngleDeg - endAngleDeg) * catProgress;
  const currentAngleRad = (currentAngleDeg * Math.PI) / 180;

  const catX = catProgress === 0 ? 52 : arcCenterX + walkRadius * Math.cos(currentAngleRad);
  const catY = catProgress === 0 ? 226 : arcCenterY - walkRadius * Math.sin(currentAngleRad);
  const catBounce = catProgress > 0 && catProgress < 1 ? Math.sin(catProgress * Math.PI * 10) * 5 : 0;

  const outerRadius = 250;
  const bandWidth = 16;

  return (
    <div
      className="app-container"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* 金の紙吹雪 */}
      {gameState === 'cleared' && (
        <div className="confetti-layer">
          {confetti.map((c) => (
            <div
              key={c.id}
              className="confetti-piece"
              style={{
                left: `${c.left}%`,
                width: `${c.size}px`,
                height: `${c.size * 0.6}px`,
                backgroundColor: c.color,
                transform: `rotate(${c.rotation}deg)`,
                animation: `confettiFall ${c.duration}s linear ${c.delay}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      {/* 上部ステータスバー */}
      <header className="game-header">
        <div className={`badge-pill badge-time ${timeLeft <= 15 ? 'urgent' : ''}`}>
          <Clock size={16} color={timeLeft <= 15 ? '#e11d48' : '#0ea5e9'} />
          <span>{timeLeft}秒</span>
        </div>

        <div className="badge-pill badge-progress">
          <Sparkles size={16} color="#f59e0b" />
          <span>
            虹の完成度: <strong className="count">{filledBands.filter(Boolean).length}</strong> / 7色
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowSample(!showSample)}
          className="help-btn"
          title="おてほんを見る"
        >
          <HelpCircle size={20} />
        </button>
      </header>

      {/* おてほんヒント */}
      {showSample && (
        <div className="sample-bar-wrap">
          <div className="sample-bar">
            <span>おてほん（外側から）：</span>
            <div className="sample-colors">
              {TARGET_COLORS.map((c, i) => (
                <div key={i} className="sample-item">
                  <span className="sample-dot" style={{ backgroundColor: c.hex }} />
                  <span>{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* メインイラストステージ */}
      <main className="stage-wrapper">
        <div className="sky-canvas">
          {feedback && (
            <div className={`feedback-toast ${feedback.type}`}>
              {feedback.text}
            </div>
          )}

          <svg viewBox="0 0 360 260" className="sky-svg">
            {/* 白い雲 */}
            <g className="cloud-float" fill="#FFFFFF" stroke="#334155" strokeWidth="2.2" strokeLinejoin="round">
              <path d="M 35 65 C 25 65, 20 53, 30 48 C 32 36, 48 33, 56 42 C 65 34, 82 39, 82 51 C 90 54, 88 65, 78 65 Z" />
              <path d="M 18 125 C 12 125, 9 117, 15 114 C 17 107, 27 105, 32 111 C 38 106, 48 109, 48 116 C 53 118, 52 125, 45 125 Z" />
            </g>

            {/* 90度の虹（端は外枠と密着・境目は黒線・初期白地） */}
            <g>
              {Array.from({ length: 7 }).map((_, idx) => {
                const rOuter = outerRadius - idx * bandWidth;
                const rInner = rOuter - bandWidth;
                const fillColor = filledBands[idx] ? TARGET_COLORS[idx].hex : '#FFFFFF';
                const d = [
                  `M ${360 - rOuter} 260`,
                  `A ${rOuter} ${rOuter} 0 0 1 360 ${260 - rOuter}`,
                  `L 360 ${260 - rInner}`,
                  `A ${rInner} ${rInner} 0 0 0 ${360 - rInner} 260`,
                  'Z',
                ].join(' ');

                return (
                  <path
                    key={idx}
                    d={d}
                    fill={fillColor}
                    stroke="#1E293B"
                    strokeWidth="2.4"
                    strokeLinejoin="round"
                  />
                );
              })}

              <path
                d={`M ${360 - (outerRadius - 7 * bandWidth)} 260 A ${outerRadius - 7 * bandWidth} ${
                  outerRadius - 7 * bandWidth
                } 0 0 1 360 ${260 - (outerRadius - 7 * bandWidth)}`}
                fill="none"
                stroke="#1E293B"
                strokeWidth="2.4"
              />
            </g>

            {/* 虹のてっぺんの雲 */}
            <g fill="#FFFFFF" stroke="#1E293B" strokeWidth="2.3" strokeLinejoin="round">
              <path d="M 278 66 C 266 66, 262 52, 273 47 C 276 35, 294 33, 302 42 C 312 33, 332 36, 336 48 C 348 51, 348 66, 334 66 Z" />
            </g>

            {/* ちょび髭の神様（サンリオ風） */}
            <g transform="translate(310, 32)">
              <ellipse cx="0" cy="-24" rx="13" ry="4" fill="none" stroke="#FBBF24" strokeWidth="2.8" />
              <path
                d="M -14 16 C -16 4, -10 -2, 0 -2 C 10 -2, 16 4, 14 16 Z"
                fill="#FFFDF7"
                stroke="#1E293B"
                strokeWidth="2.2"
              />
              <path d="M -11 7 Q 0 11 11 7" fill="none" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" />
              <circle cx="0" cy="-10" r="13" fill="#FFE8D6" stroke="#1E293B" strokeWidth="2.2" />
              <circle cx="-12" cy="-12" r="5" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2" />
              <circle cx="12" cy="-12" r="5" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2" />
              <path
                d="M -11 -18 C -7 -24, 7 -24, 11 -18"
                fill="#FFFFFF"
                stroke="#1E293B"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="-4.5" cy="-11" r="1.8" fill="#1E293B" />
              <circle cx="4.5" cy="-11" r="1.8" fill="#1E293B" />
              <ellipse cx="-7.5" cy="-8.5" rx="2.3" ry="1.4" fill="#FDA4AF" />
              <ellipse cx="7.5" cy="-8.5" rx="2.3" ry="1.4" fill="#FDA4AF" />
              {/* ちょび髭 */}
              <path
                d="M -4.5 -6.5 Q -2 -8.2 0 -6.8 Q 2 -8.2 4.5 -6.5 Q 2.2 -4.8 0 -5.8 Q -2.2 -4.8 -4.5 -6.5 Z"
                fill="#FFFFFF"
                stroke="#1E293B"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path d="M -1.8 -4 Q 0 -2.5 1.8 -4" fill="none" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" />
            </g>

            {/* 左下の草原 */}
            <path
              d="M 0 242 Q 45 232 95 244 Q 125 250 140 260 L 0 260 Z"
              fill="#BBF7D0"
              stroke="#1E293B"
              strokeWidth="2.2"
            />

            {/* 三毛猫のなっちゃん（サンリオ風） */}
            <g transform={`translate(${catX}, ${catY - catBounce})`}>
              <path
                d="M -16 12 C -26 8, -28 -4, -20 -6 C -15 -7, -14 2, -14 8"
                fill="#FFFFFF"
                stroke="#1E293B"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <circle cx="-22" cy="-3" r="3" fill="#F59E0B" />
              <ellipse cx="0" cy="11" rx="13" ry="11" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2.2" />
              <path d="M 4 5 C 10 5, 12 12, 7 15 C 3 15, 2 9, 4 5 Z" fill="#1E293B" />
              <ellipse cx="-6" cy="20" rx="4" ry="3" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2" />
              <ellipse cx="6" cy="20" rx="4" ry="3" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2" />

              <g transform="translate(0, -6)">
                <path
                  d="M -16 -6 L -19 -20 L -6 -13 Z"
                  fill="#F59E0B"
                  stroke="#1E293B"
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                />
                <path
                  d="M 16 -6 L 19 -20 L 6 -13 Z"
                  fill="#334155"
                  stroke="#1E293B"
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                />
                <ellipse cx="0" cy="-2" rx="18" ry="14" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2.2" />
                <path d="M -15 -8 C -11 -15, -3 -15, -2 -9 C -6 -6, -12 -6, -15 -8 Z" fill="#F59E0B" />
                <path d="M 15 -8 C 11 -15, 3 -15, 2 -9 C 6 -6, 12 -6, 15 -8 Z" fill="#334155" />
                <g transform="translate(-13, -15) rotate(-20)">
                  <circle cx="0" cy="0" r="2.2" fill="#FF4B5C" stroke="#1E293B" strokeWidth="1.4" />
                  <path d="M -1 0 L -6 -3 L -6 3 Z" fill="#FF4B5C" stroke="#1E293B" strokeWidth="1.4" />
                  <path d="M 1 0 L 6 -3 L 6 3 Z" fill="#FF4B5C" stroke="#1E293B" strokeWidth="1.4" />
                </g>

                {gameState === 'cleared' ? (
                  <>
                    <path d="M -10 -2 Q -7.5 -5.5 -5 -2" fill="none" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
                    <path d="M 5 -2 Q 7.5 -5.5 10 -2" fill="none" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
                  </>
                ) : (
                  <>
                    <ellipse cx="-7.5" cy="-1.5" rx="2.1" ry="2.6" fill="#1E293B" />
                    <circle cx="-8.1" cy="-2.3" r="0.8" fill="#FFFFFF" />
                    <ellipse cx="7.5" cy="-1.5" rx="2.1" ry="2.6" fill="#1E293B" />
                    <circle cx="6.9" cy="-2.3" r="0.8" fill="#FFFFFF" />
                  </>
                )}

                <ellipse cx="-11.5" cy="2" rx="2.8" ry="1.6" fill="#FDA4AF" opacity="0.8" />
                <ellipse cx="11.5" cy="2" rx="2.8" ry="1.6" fill="#FDA4AF" opacity="0.8" />
                <ellipse cx="0" cy="1" rx="2" ry="1.4" fill="#FBBF24" stroke="#1E293B" strokeWidth="1.2" />
                <path
                  d="M -3 3.5 Q -1.5 5.2 0 3.5 Q 1.5 5.2 3 3.5"
                  fill="none"
                  stroke="#1E293B"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
                <line x1="-19" y1="-1" x2="-14" y2="0" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="-19" y1="2.5" x2="-14" y2="2.5" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="19" y1="-1" x2="14" y2="0" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="19" y1="2.5" x2="14" y2="2.5" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" />
              </g>
            </g>
          </svg>

          {/* スタート画面 */}
          {gameState === 'start' && (
            <div className="modal-overlay">
              <div className="modal-card">
                <span className="modal-badge">制限時間 90秒！</span>
                <h1 className="modal-title">なっちゃんと虹の橋</h1>
                <p className="modal-desc">
                  35色の中から<strong>本物の虹の7色</strong>を上へフリック（またはタップ）して選ぼう！
                  7色そろうとなっちゃんが神様に会えるよ♪
                </p>
                <button type="button" onClick={initializeGame} className="primary-btn">
                  <Play size={18} fill="currentColor" />
                  ゲームスタート！
                </button>
              </div>
            </div>
          )}

          {/* クリアバナー */}
          {gameState === 'cleared' && (
            <div className="clear-banner">
              <div className="clear-info">
                <Trophy size={24} color="#f59e0b" />
                <div>
                  <p className="clear-title">おめでとう！神様に会えたにゃ！</p>
                  <p className="clear-sub">クリアタイム: {90 - timeLeft}秒</p>
                </div>
              </div>
              <button type="button" onClick={initializeGame} className="replay-btn">
                <RotateCcw size={14} />
                もう一回
              </button>
            </div>
          )}

          {/* ゲームオーバー画面 */}
          {gameState === 'gameover' && (
            <div className="modal-overlay">
              <div className="modal-card gameover">
                <h2 className="modal-title">タイムアップ！</h2>
                <p className="modal-desc">
                  あと {7 - filledBands.filter(Boolean).length} 色で虹が完成だったにゃ…！
                </p>
                <button type="button" onClick={initializeGame} className="primary-btn retry">
                  <RotateCcw size={16} />
                  リトライする
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 下部35色パレット */}
      <section className="palette-section">
        <div className="palette-card">
          <div className="palette-header">
            <span className="palette-guide">▲ 正解の色を上へフリック（またはタップ）！</span>
            <span className="palette-count">全35色</span>
          </div>

          <div className="color-grid">
            {(palette.length > 0 ? palette : PALETTE_DATA.map((p, i) => ({ ...p, id: `init-${i}` }))).map(
              (option) => {
                const isAlreadyFound = option.targetIndex !== -1 && filledBands[option.targetIndex];
                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={gameState !== 'playing' || isAlreadyFound}
                    onPointerDown={(e) => handlePointerDown(e, option)}
                    style={{ backgroundColor: option.hex }}
                    className={`color-ball ${isAlreadyFound ? 'found' : ''}`}
                    aria-label={option.name}
                  >
                    {isAlreadyFound && <span className="check-mark">✓</span>}
                  </button>
                );
              }
            )}
          </div>
        </div>
      </section>

      {/* フリック時の追従ボール */}
      {draggedColor && dragPos && (
        <div
          className="drag-orb"
          style={{
            left: dragPos.x,
            top: dragPos.y,
            backgroundColor: draggedColor.hex,
          }}
        />
      )}
    </div>
  );
}
