"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Search, Heart, Settings } from "lucide-react";
import { Link, useLocation } from "wouter";

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Search, label: "Search", href: "/search" },
  { icon: Heart, label: "Favorites", href: "/favorites" },
  { icon: Settings, label: "Settings", href: "/settings" }
];

export default function Toolbar() {
  const [location] = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-4 w-fit mx-auto left-0 right-0 z-50"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="expanded"
            layoutId="toolbar" // shared layoutId for smooth transition
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="flex items-center gap-2 px-6 py-3 rounded-full shadow-lg bg-background/80 backdrop-blur-lg border border-border/50"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="icon"
                    className="relative"
                  >
                    <Icon className="h-5 w-5" />
                    <span className="sr-only">{item.label}</span>

                    {isActive && (
                      <motion.div
                        layoutId="active-indicator"
                        className="absolute -bottom-1 inset-x-0 mx-auto w-1 h-1 bg-primary rounded-full"
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30
                        }}
                      />
                    )}
                  </Button>
                </Link>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="collapsed"
            layoutId="toolbar" // same layoutId here as well
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="p-3 rounded-full shadow-lg bg-background/80 backdrop-blur-lg border border-border/50 flex items-center justify-center"
          >
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
              <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
              <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
            </div>
            <span className="sr-only">Open navigation menu</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
