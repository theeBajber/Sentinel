"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface ConsentModalProps {
  isOpen: boolean;
  onAccept: () => void;
}

export default function ConsentModal({ isOpen, onAccept }: ConsentModalProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-bg-card rounded-2xl border border-bg-hover shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-6">
              {/* Header */}
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-accent-blue/20 rounded-lg flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-accent-blue" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-text-primary">
                    Data Collection Consent
                  </h2>
                  <p className="text-xs text-text-muted mt-1 tracking-widest uppercase">
                    Privacy & Security
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <p className="text-sm sm:text-base text-text-primary leading-relaxed">
                  Sentinel collects and analyzes your browsing history to provide real-time phishing detection and threat protection.
                </p>

                <div className="space-y-3 bg-bg-primary/50 rounded-lg p-4 border border-bg-hover">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-accent-blue">
                    Data collected includes:
                  </h3>
                  <ul className="space-y-2 text-xs sm:text-sm text-text-muted">
                    <li className="flex items-start gap-2">
                      <span className="text-accent-blue mt-1">•</span>
                      <span>Visited URLs and domains</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent-blue mt-1">•</span>
                      <span>Scan results and threat assessments</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent-blue mt-1">•</span>
                      <span>Client IP address and timestamp</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent-blue mt-1">•</span>
                      <span>Threat detection patterns and analytics</span>
                    </li>
                  </ul>
                </div>

                <p className="text-xs text-text-muted leading-relaxed">
                  Your data is encrypted and processed securely. You can review and manage your data in the Settings page at any time.
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={onAccept}
                className="w-full py-3 px-4 bg-accent-blue text-bg-primary font-semibold rounded-lg transition-all hover:opacity-90 active:scale-95 text-sm sm:text-base"
              >
                I Understand & Accept
              </button>

              <p className="text-xs text-text-muted text-center">
                By accepting, you agree to our data collection practices as outlined above.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
