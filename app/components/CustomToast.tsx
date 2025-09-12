import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

export const CustomToast = (props: { message: string }) => {
  const [isMoved, setIsMoved] = useState(true);

  useEffect(() => {
    if (isMoved) {
      const timer = setTimeout(() => {
        setIsMoved(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isMoved]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ translateX: 0 }}
        animate={
          isMoved
            ? { translateX: 160, opacity: 1 }
            : { translateX: 0, opacity: 0 }
        }
        exit={{ translateX: 0, opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut", type: "spring" }}
        className="absolute right-0 flex h-10 w-[150px] items-center justify-center rounded-lg border-1 border-dashed bg-zinc-900 px-2"
      >
        {props.message}
      </motion.div>
    </AnimatePresence>
  );
};
