import { motion } from 'framer-motion';

// Each ball has its own size, position, animation duration and delay
// so they all move independently and never look synchronized.
const BALLS = [
  { size: 80,  top: '8%',  left: '12%', duration: 9,  delay: 0   },
  { size: 50,  top: '18%', left: '72%', duration: 11, delay: 1.5 },
  { size: 110, top: '55%', left: '5%',  duration: 13, delay: 0.8 },
  { size: 40,  top: '72%', left: '80%', duration: 8,  delay: 2.2 },
  { size: 70,  top: '40%', left: '88%', duration: 10, delay: 0.4 },
  { size: 35,  top: '85%', left: '35%', duration: 12, delay: 1.9 },
  { size: 90,  top: '10%', left: '48%', duration: 14, delay: 3.0 },
  { size: 55,  top: '62%', left: '55%', duration: 9,  delay: 1.1 },
];

export function FloatingBalls() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {BALLS.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width:  b.size,
            height: b.size,
            top:    b.top,
            left:   b.left,
            opacity: 0.06,
          }}
          animate={{
            y: [0, -28, 14, -20, 0],
            x: [0, 12, -8, 16, 0],
            scale: [1, 1.06, 0.97, 1.04, 1],
          }}
          transition={{
            duration: b.duration,
            delay:    b.delay,
            repeat:   Infinity,
            ease:     'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
