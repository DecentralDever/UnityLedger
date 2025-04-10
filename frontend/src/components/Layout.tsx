import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import ConnectButton from "./ConnectButton";
import { Menu, X, ChevronDown, ExternalLink, Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeProvider";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll to add shadow to header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Variants for mobile menu animation
  const mobileMenuVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  // Navigation items
  const navItems = [
    { to: "/", label: "Dashboard" },
    { to: "/join-create", label: "Create Pool" },
  ];

  // Dropdown items
  const dropdownItems = [
    { to: "/pools", label: "All Pools" },
    { to: "/analytics", label: "Analytics" },
    { to: "/leaderboard", label: "Leaderboard" },
  ];

  // Social links
  const socialLinks = [
    { href: "https://twitter.com/unityledger", label: "Twitter" },
    { href: "https://discord.gg/unityledger", label: "Discord" },
    { href: "https://github.com/unityledger", label: "GitHub" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only fixed top-4 left-4 z-50 bg-indigo-600 text-white p-3 rounded-md"
      >
        Skip to content
      </a>

      <header
        className={`sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 backdrop-blur-md transition-all duration-300 ${
          scrolled ? "shadow-md" : ""
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center">
                <motion.img
                  src="/images/UL.png"
                  alt="UnityLedger"
                  className="h-8 w-auto"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                />
                <span className="ml-3 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 hidden sm:block">
                  UnityLedger
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${
                    location.pathname === item.to
                      ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                  }`}
                >
                  {item.label}
                  {location.pathname === item.to && (
                    <motion.div
                      layoutId="underline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded"
                    />
                  )}
                </Link>
              ))}
              <div className="relative group">
                <button className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 flex items-center transition-colors">
                  Explore
                  <ChevronDown size={16} className="ml-1" />
                </button>
                <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 transform opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 origin-top-left">
                  <div className="py-1">
                    {dropdownItems.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </nav>

            {/* Right side: Wallet connect, theme toggle, external links */}
            <div className="flex items-center space-x-4">
              <motion.button
                onClick={toggleTheme}
                className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle dark mode"
                whileTap={{ scale: 0.9 }}
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </motion.button>

              <a
                href="https://docs.unityledger.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors"
              >
                Docs
                <ExternalLink size={14} className="ml-1" />
              </a>

              <ConnectButton />

              {/* Mobile menu button */}
              <div className="md:hidden flex items-center">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-expanded={mobileMenuOpen}
                  aria-controls="mobile-menu"
                >
                  <span className="sr-only">Open main menu</span>
                  {mobileMenuOpen ? (
                    <X className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Menu className="block h-6 w-6" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              id="mobile-menu"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={mobileMenuVariants}
              transition={{ duration: 0.3 }}
              className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 py-3 px-4"
            >
              <div className="space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                {dropdownItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <a
                  href="https://docs.unityledger.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Docs
                  <ExternalLink size={14} className="ml-1" />
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main id="main-content" className="flex-1">
        {children}
      </main>

      <footer className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0 flex items-center">
              <motion.img
                src="/images/UL.png"
                alt="UnityLedger"
                className="h-8 w-auto mr-3"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              />
              <span className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                UnityLedger
              </span>
            </div>

            <div className="flex space-x-6">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  whileHover={{ scale: 1.1 }}
                >
                  {social.label}
                </motion.a>
              ))}
            </div>
          </div>

          <div className="mt-8 border-t border-gray-100 dark:border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © 2025 UnityLedger. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0 flex space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <Link to="/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
