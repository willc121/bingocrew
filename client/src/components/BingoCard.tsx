import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToggleProgress } from "@/hooks/use-game";
import { Star, CheckCircle, Lock } from "lucide-react";

interface BingoItem {
  id: string;
  text: string;
  category?: string;
}

interface BingoCardProps {
  groupId: string;
  items: BingoItem[];
  completedIndices: number[];
  locked?: boolean;
}

export function BingoCard({ groupId, items, completedIndices, locked = false }: BingoCardProps) {
  const { mutate: toggleProgress, isPending } = useToggleProgress(groupId);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const handleSquareClick = (index: number) => {
    if (locked || index === 12 || isPending) return;
    const isCompleted = completedIndices.includes(index);
    toggleProgress({ squareIndex: index, completed: !isCompleted });
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 md:p-6 bg-white dark:bg-card rounded-3xl shadow-2xl border border-border/50">
      <div className="grid grid-cols-5 gap-2 md:gap-3 aspect-square">
        {Array.from({ length: 25 }).map((_, index) => {
          // Logic for center square (FREE SPACE)
          if (index === 12) {
            return (
              <div 
                key={index}
                className="relative flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg transform scale-100 z-10 aspect-square"
              >
                <Star className="w-6 h-6 md:w-8 md:h-8 fill-yellow-400 text-yellow-400 animate-pulse" />
                <span className="text-[10px] md:text-xs font-bold mt-1 tracking-wider uppercase">Free</span>
              </div>
            );
          }

          const item = items[index];
          const isCompleted = completedIndices.includes(index);
          const isHovered = hoverIndex === index;

          return (
            <motion.button
              key={index}
              onClick={() => handleSquareClick(index)}
              onMouseEnter={() => setHoverIndex(index)}
              onMouseLeave={() => setHoverIndex(null)}
              whileHover={{ scale: locked ? 1 : 1.05 }}
              whileTap={{ scale: locked ? 1 : 0.95 }}
              className={cn(
                "relative flex flex-col items-center justify-center p-1 md:p-3 rounded-xl text-center transition-all duration-300 border-2 select-none aspect-square overflow-hidden",
                "focus:outline-none focus:ring-4 focus:ring-primary/20",
                locked && "cursor-not-allowed opacity-80",
                !item && "bg-muted/50 border-dashed border-muted-foreground/30", // Empty state
                
                // Completed State
                isCompleted 
                  ? "bg-primary/10 border-primary text-primary shadow-inner" 
                  : "bg-background border-border hover:border-primary/50 hover:shadow-lg",
                
                // Typography
                "text-[9px] sm:text-xs md:text-sm font-medium leading-tight"
              )}
            >
              {locked && (
                <div className="absolute top-1 right-1 opacity-20">
                  <Lock className="w-3 h-3" />
                </div>
              )}
              
              {isCompleted && (
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center bg-primary/5 backdrop-blur-[1px] rounded-xl z-0"
                >
                  <CheckCircle className="w-8 h-8 md:w-12 md:h-12 text-primary opacity-20" />
                </motion.div>
              )}
              
              <span 
                className="relative z-10 break-words hyphens-auto w-full"
                style={{
                  fontSize: item?.text && item.text.length > 50 
                    ? '0.5rem' 
                    : item?.text && item.text.length > 30 
                      ? '0.6rem' 
                      : item?.text && item.text.length > 15 
                        ? '0.7rem' 
                        : '0.75rem',
                  lineHeight: 1.2,
                }}
              >
                {item?.text || "Empty"}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
