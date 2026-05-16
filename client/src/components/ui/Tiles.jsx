import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * Tiles — interactive hover-lit grid background.
 *
 * Uses a CSS grid that auto-fills columns based on cellSize so the grid
 * always covers the full width and height of its container without gaps.
 *
 * @param {number}  rowCount  - number of tile rows (should cover viewport height)
 * @param {number}  colCount  - number of tile columns (should cover viewport width)
 * @param {number}  cellSize  - pixel side-length of each square tile (default 48)
 * @param {string}  className - extra classes on the wrapper
 */
export function Tiles({
  rowCount = 35,
  colCount = 30,
  cellSize = 48,
  className,
}) {
  const total = rowCount * colCount;

  return (
    <div
      className={cn('w-full h-full', className)}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${colCount}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${rowCount}, ${cellSize}px)`,
        justifyContent: 'center',
      }}
    >
      {Array.from({ length: total }).map((_, idx) => (
        <motion.div
          key={idx}
          whileHover={{
            backgroundColor: 'var(--tile)',
            transition: { duration: 0 },
          }}
          animate={{ transition: { duration: 2 } }}
          style={{
            width: cellSize,
            height: cellSize,
            border: '1px solid rgba(167, 139, 250, 0.16)',
            boxSizing: 'border-box',
          }}
        />
      ))}
    </div>
  );
}

export default Tiles;

