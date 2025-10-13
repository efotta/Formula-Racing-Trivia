
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PerfectCompletionCelebrationProps {
  isVisible: boolean;
  onComplete: () => void;
}

// Firework particle component
const FireworkParticle = ({ delay = 0, startX = 50, startY = 50 }: { delay?: number; startX?: number; startY?: number }) => {
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF'];
  const [randomValues, setRandomValues] = useState({
    color: colors[0], // Default color to avoid hydration mismatch
    xOffset: 0,
    yOffset: 0
  });
  
  // Generate random values only on client side
  useEffect(() => {
    setRandomValues({
      color: colors[Math.floor(Math.random() * colors.length)],
      xOffset: (Math.random() - 0.5) * 300,
      yOffset: (Math.random() - 0.5) * 300
    });
  }, []);
  
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full"
      style={{
        backgroundColor: randomValues.color,
        left: `${startX}%`,
        top: `${startY}%`,
      }}
      initial={{ 
        scale: 0, 
        x: 0, 
        y: 0,
        opacity: 1 
      }}
      animate={{
        scale: [0, 1, 0],
        x: [0, randomValues.xOffset],
        y: [0, randomValues.yOffset],
        opacity: [1, 1, 0],
      }}
      transition={{
        duration: 2,
        delay: delay,
        ease: "easeOut"
      }}
    />
  );
};

// Main firework burst component
const FireworkBurst = ({ delay = 0, x = 50, y = 50 }: { delay?: number; x?: number; y?: number }) => {
  const particleCount = 12;
  
  return (
    <>
      {Array.from({ length: particleCount }).map((_, i) => (
        <FireworkParticle
          key={i}
          delay={delay + i * 0.05}
          startX={x}
          startY={y}
        />
      ))}
    </>
  );
};

export default function PerfectCompletionCelebration({ isVisible, onComplete }: PerfectCompletionCelebrationProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Show content after a brief delay
      const contentTimer = setTimeout(() => {
        setShowContent(true);
      }, 300);

      // Auto-complete after 5 seconds
      const completeTimer = setTimeout(() => {
        onComplete();
      }, 5000);

      return () => {
        clearTimeout(contentTimer);
        clearTimeout(completeTimer);
      };
    } else {
      setShowContent(false);
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        style={{ 
          isolation: 'isolate',
          pointerEvents: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fireworks Background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Multiple firework bursts at different positions and times */}
          <FireworkBurst delay={0.5} x={20} y={30} />
          <FireworkBurst delay={1.0} x={80} y={25} />
          <FireworkBurst delay={1.5} x={60} y={70} />
          <FireworkBurst delay={2.0} x={15} y={80} />
          <FireworkBurst delay={2.5} x={85} y={60} />
          <FireworkBurst delay={3.0} x={40} y={20} />
          <FireworkBurst delay={3.5} x={90} y={40} />
          <FireworkBurst delay={4.0} x={10} y={50} />
          <FireworkBurst delay={0.8} x={50} y={40} />
          <FireworkBurst delay={1.8} x={30} y={60} />
        </div>

        {/* Main Content */}
        <AnimatePresence>
          {showContent && (
            <motion.div
              className="relative z-[10000] text-center px-6 max-w-[90vw] w-full"
              initial={{ scale: 0, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0, y: -50, opacity: 0 }}
              transition={{ 
                type: "spring", 
                damping: 15, 
                stiffness: 200,
                delay: 0.2 
              }}
            >
              {/* Trophy Icon */}
              <motion.div
                className="text-3xl sm:text-5xl md:text-7xl mb-2 sm:mb-4"
                initial={{ rotateY: 0 }}
                animate={{ rotateY: 360 }}
                transition={{ 
                  duration: 2, 
                  ease: "easeInOut",
                  repeat: 1,
                  delay: 0.5 
                }}
              >
                🏆
              </motion.div>

              {/* Congratulations Text */}
              <motion.h1
                className="text-2xl sm:text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-2 sm:mb-3 px-1"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.8 }}
              >
                Congratulations!
              </motion.h1>

              {/* Formula Racing Legend Status - Always split into lines for mobile */}
              <motion.div
                className="mb-3 sm:mb-5 px-1"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.8 }}
              >
                <h2 className="text-lg sm:text-xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 leading-tight">
                  <span className="block">Formula Racing</span>
                  <span className="block">Legend Status</span>
                </h2>
              </motion.div>

              {/* Achievement Description */}
              <motion.p
                className="text-xs sm:text-sm md:text-lg text-gray-300 mb-3 sm:mb-6 max-w-[85vw] sm:max-w-sm mx-auto px-1 leading-relaxed"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.6, duration: 0.8 }}
              >
                <span className="block">Perfect completion of all 5 levels</span>
                <span className="block">with zero wrong answers!</span>
                <span className="block mt-2">You are truly a Formula</span>
                <span className="block">Racing Trivia Master!</span>
              </motion.p>

              {/* Stars and decorative elements */}
              <motion.div
                className="flex justify-center space-x-1 sm:space-x-2 text-lg sm:text-xl md:text-2xl"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 2.0, duration: 0.5 }}
              >
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  ⭐
                </motion.span>
                <motion.span
                  animate={{ rotate: -360 }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                >
                  🌟
                </motion.span>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  ⭐
                </motion.span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress indicator */}
        <motion.div
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-[10000] px-6 max-w-[90vw]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
        >
          <div className="text-gray-400 text-xs text-center">
            <p className="mb-2">Returning to level selection...</p>
            <motion.div
              className="w-20 sm:w-28 h-1 bg-gray-700 rounded-full overflow-hidden mx-auto"
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2.5, delay: 2.5 }}
              />
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
