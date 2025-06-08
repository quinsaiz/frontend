import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { ChangePassword } from '../components/ChangePassword';

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [hasResults, setHasResults] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setHasResults(query.trim().length > 0);
  };

  const iconAnimations = [
    { x: 0, y: [-10, 10, -10], rotate: [0, 2, -2], duration: 6 },
    { x: [-5, 5, -5], y: [0, -15, 0], rotate: [0, -3, 0], duration: 7 },
    { x: [0, -3, 0], y: [-8, 8, -8], rotate: [0, 1, -1], duration: 5.5 },
    { x: [5, -5, 5], y: [0, 12, 0], rotate: [0, -2, 0], duration: 6.5 },
    { x: [-3, 3, -3], y: [-10, 10, -10], rotate: [0, 3, -3], duration: 6 },
    { x: [0, 5, 0], y: [8, -8, 8], rotate: [0, -1, 1], duration: 5 },
    { x: [-5, 5, -5], y: [0, 10, 0], rotate: [0, 2, 0], duration: 6 },
    { x: [5, -5, 5], y: [0, -10, 0], rotate: [0, 1, -1], duration: 7 },
  ];

  const icons = [
    { src: '/book-icon.svg', alt: 'Book', left: '22%', top: '35%' },
    { src: '/graduate-icon.svg', alt: 'Graduation Cap', left: '70%', top: '32%' },
    { src: '/micro-icon.svg', alt: 'Micro', left: '62%', top: '48%' },
    { src: '/lab-icon.svg', alt: 'Lab', left: '73%', top: '67%' },
    { src: '/explore-icon.svg', alt: 'Explore', left: '41%', top: '40%' },
    { src: '/folder-icon.svg', alt: 'Folder', left: '50%', top: '60%' },
    { src: '/draw-icon.svg', alt: 'Atom', left: '28%', top: '55%' },
    { src: '/science-icon.svg', alt: 'Science', left: '34%', top: '75%' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-white dark:bg-surface-dark">
      <AnimatePresence>
        {!hasResults && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-0 pointer-events-none select-none"
          >
            {icons.map((icon, index) => (
              <motion.div
                key={index}
                animate={{
                  x: iconAnimations[index].x,
                  y: iconAnimations[index].y,
                  rotate: iconAnimations[index].rotate,
                  //scale: iconAnimations[index].scale,
                }}
                transition={{
                  duration: iconAnimations[index].duration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className={`absolute w-12 h-12 md:w-16 md:h-16 hover:scale-110 hover:opacity-80 transition-transform duration-200`}
                style={{ left: icon.left, top: icon.top }}
              >
                <img
                  src={icon.src}
                  alt={icon.alt}
                  className="w-full h-full dark:invert"
                  draggable="false"
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 container mx-auto px-4">
        <motion.div
          animate={{
            y: hasResults ? -60 : 0,
          }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 20,
          }}
          className="pt-20 md:pt-32"
        >
          <motion.h1
            animate={{
              opacity: hasResults ? 0 : 1,
              y: hasResults ? -20 : 0,
            }}
            transition={{
              duration: 0.3,
            }}
            className="text-3xl md:text-4xl font-bold text-center text-gray-800 dark:text-gray-100 mt-6 mb-8"
          >
            Пошук наукових робіт
          </motion.h1>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Введіть ключові слова для пошуку..."
                className="input-field w-full px-5 py-3 pl-12 rounded-full shadow-neomorphic-light dark:shadow-neomorphic-dark border border-gray-200 dark:border-gray-700 focus:border-primary dark:focus:border-primary-dark"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 w-5 h-5" />
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {hasResults && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{
                type: 'spring',
                stiffness: 100,
                damping: 15,
              }}
              className="mt-8"
            >
              <div className="card p-6">
                <p className="text-gray-600 dark:text-gray-300">
                  Результати пошуку для: {searchQuery}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showChangePassword && <ChangePassword onClose={() => setShowChangePassword(false)} />}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
