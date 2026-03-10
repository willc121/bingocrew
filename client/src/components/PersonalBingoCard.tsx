import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Star, CheckCircle, Sparkles } from "lucide-react";
import { getTheme } from "@shared/themes";

interface BingoItem {
  id: string;
  text: string;
  category?: string;
}

export interface PersonalBingoCardProps {
  cardId: string;
  items: BingoItem[];
  completedIndices: number[];
  winningLineIndices?: Set<number>;
  onToggle: (index: number, completed: boolean) => void;
  isPending?: boolean;
  theme?: string;
  readOnly?: boolean;
}

export function PersonalBingoCard({ 
  cardId, 
  items, 
  completedIndices, 
  winningLineIndices = new Set(),
  onToggle, 
  isPending = false,
  theme = "default",
  readOnly = false
}: PersonalBingoCardProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const themeConfig = getTheme(theme);

  const handleSquareClick = (index: number) => {
    if (index === 12 || isPending || readOnly) return;
    const isCompleted = completedIndices.includes(index);
    onToggle(index, !isCompleted);
  };

  return (
    <div className={cn(
      "w-full max-w-2xl mx-auto p-4 md:p-6 rounded-3xl shadow-2xl border",
      themeConfig.card.background,
      themeConfig.card.border
    )}>
      <div className="grid grid-cols-5 gap-2 md:gap-3 aspect-square">
        {Array.from({ length: 25 }).map((_, index) => {
          if (index === 12) {
            return (
              <div 
                key={index}
                data-testid={`bingo-square-${index}`}
                className={cn(
                  "relative flex flex-col items-center justify-center p-2 rounded-xl shadow-lg transform scale-100 z-10 aspect-square",
                  themeConfig.freeSpace.gradient,
                  themeConfig.freeSpace.text
                )}
              >
                <Star className="w-6 h-6 md:w-8 md:h-8 fill-yellow-400 text-yellow-400 animate-pulse" />
                <span className="text-xs md:text-sm font-bold mt-1 tracking-wider uppercase">Free</span>
              </div>
            );
          }

          const item = items[index];
          const isCompleted = completedIndices.includes(index);
          const isWinningPart = winningLineIndices.has(index);

          return (
            <motion.button
              key={index}
              data-testid={`bingo-square-${index}`}
              onClick={() => handleSquareClick(index)}
              onMouseEnter={() => setHoverIndex(index)}
              onMouseLeave={() => setHoverIndex(null)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isPending}
              className={cn(
                "relative flex flex-col items-center justify-center p-1 md:p-3 rounded-xl text-center transition-all duration-300 border-2 select-none aspect-square overflow-hidden",
                "focus:outline-none focus:ring-4 focus:ring-primary/20",
                !item && "border-dashed opacity-50",
                isWinningPart && isCompleted && "ring-2 ring-yellow-500 ring-offset-2",
                isCompleted 
                  ? cn(themeConfig.completed.background, themeConfig.completed.border, themeConfig.completed.text, "shadow-inner")
                  : cn(themeConfig.square.background, themeConfig.square.border, themeConfig.square.text, themeConfig.square.hoverBorder, "hover:shadow-lg"),
                "text-xs sm:text-sm md:text-base font-medium leading-tight",
                isPending && "cursor-wait opacity-70"
              )}
            >
              {isWinningPart && isCompleted && (
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="w-3 h-3 text-yellow-500 animate-pulse" />
                </div>
              )}
              
              {isCompleted && (
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center backdrop-blur-[1px] rounded-xl z-0"
                >
                  <CheckCircle className={cn("w-8 h-8 md:w-12 md:h-12 opacity-20", themeConfig.completed.checkColor)} />
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
