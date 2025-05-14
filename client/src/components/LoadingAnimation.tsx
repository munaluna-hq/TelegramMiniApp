import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function LoadingAnimation({ onComplete }: { onComplete: () => void }) {
  const [showLogo, setShowLogo] = useState(true);
  
  useEffect(() => {
    // Trigger completion after animation finishes
    const timer = setTimeout(() => {
      setShowLogo(false);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 500);
    }, 2500);
    
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  return (
    <motion.div 
      className="fixed inset-0 flex items-center justify-center z-50 bg-pattern-primary"
      initial={{ opacity: 0 }}
      animate={{ opacity: showLogo ? 1 : 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      {/* Background decorative elements */}
      <motion.div 
        className="absolute inset-0 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{ duration: 1.5, delay: 0.3 }}
      >
        {/* Animated circles */}
        <motion.div 
          className="absolute top-[15%] right-[15%] w-16 h-16 rounded-full bg-primary/20"
          animate={{ 
            y: [0, -30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-[20%] left-[20%] w-12 h-12 rounded-full bg-accent/40"
          animate={{ 
            y: [0, 20, 0],
            scale: [1, 0.8, 1],
          }}
          transition={{ 
            duration: 3.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>
      
      <div className="relative">
        {/* Logo with pulsing circle background */}
        <motion.div
          className="absolute -inset-6 rounded-full bg-white/30 backdrop-blur-md"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: [0.8, 1.2, 0.8],
            opacity: [0, 0.5, 0] 
          }}
          transition={{ 
            duration: 2.5, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
        />
        
        {/* Logo */}
        <motion.div 
          className="relative z-10 flex flex-col items-center"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        >
          {/* App Logo - Moon and Star Logo */}
          <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center mb-4 shadow-lg relative overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-tr from-primary to-pink-400"
              animate={{ 
                backgroundPosition: ["0% 0%", "100% 100%"],
              }}
              transition={{ 
                duration: 5,
                repeat: Infinity,
                repeatType: "reverse", 
                ease: "easeInOut" 
              }}
            />
            <div className="relative z-10">
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Crescent moon */}
                <path 
                  d="M32 10C24.5817 10 18.0644 14.0039 14.6863 20.003C14.8293 20.0011 14.9728 20 15.1176 20C26.1867 20 35.1176 28.9543 35.1176 40C35.1176 41.0107 35.0526 42.0033 34.9272 42.9734C41.5609 40.0859 46 33.4857 46 26C46 17.1634 39.8366 10 32 10Z" 
                  fill="white" 
                />
                {/* Star */}
                <motion.path 
                  d="M50 12L51.8819 17.7639H58.0345L53.0763 21.2361L54.9582 27L50 23.5278L45.0418 27L46.9237 21.2361L41.9655 17.7639H48.1181L50 12Z" 
                  fill="white"
                  animate={{ 
                    opacity: [0.4, 1, 0.4],
                    scale: [0.9, 1.1, 0.9]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut" 
                  }}
                />
              </svg>
            </div>
          </div>
          
          {/* App Name */}
          <motion.div
            className="overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <motion.h1 
              className="text-3xl font-heading text-primary font-bold"
              initial={{ y: 30 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.7, duration: 0.8, ease: "easeOut" }}
            >
              MunaLuna
            </motion.h1>
          </motion.div>
          
          {/* Tagline with letter animation */}
          <div className="mt-2 h-6 overflow-hidden">
            <motion.p 
              className="text-sm text-gray-600 text-center max-w-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 1 }}
            >
              {/* Split text into individual animated letters */}
              {"Цифровой помощник для мусульманок".split("").map((char, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: 1 + (index * 0.02), 
                    duration: 0.5,
                    ease: "easeOut"
                  }}
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
            </motion.p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}