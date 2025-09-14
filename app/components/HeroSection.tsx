"use client";

import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { Pacifico } from "next/font/google";

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: ["400"],
});

export const HeroSection = () => {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-y-10">
      <motion.div
        initial={{ opacity: 0, filter: "blur(5px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="flex h-auto w-auto flex-col gap-y-2 text-center"
      >
        {" "}
        <span
          className={`${pacifico.className} bg-gradient-to-tr from-white/80 to-purple-400 bg-clip-text text-center text-4xl text-transparent md:text-5xl lg:text-7xl`}
        >
          Theoremotion
        </span>
        <span className="text-2xl font-extrabold text-white/80 md:font-semibold lg:text-4xl">
          Generate animations with AI
        </span>
      </motion.div>
      <motion.div
        initial={{
          translateY: 100,
          height: "0px",
          opacity: 0,
          filter: "blur(5px)",
        }}
        animate={{
          translateY: 0,
          height: "auto",
          opacity: 1,
          filter: "blur(0px)",
        }}
        transition={{ delay: 1, duration: 0.3 }}
        className="w-full max-w-lg"
      >
        <span className="flex w-full text-center text-sm font-normal text-orange-200/80 md:text-lg">
          Generate | Run | See live-preview and Debug manim scripts with AI, you
          can export the generated animations as mp4
        </span>
      </motion.div>

      <a className="h-auto w-auto" href="#editor">
        <motion.div
          initial={{
            translateY: 100,
            opacity: 0,
            filter: "blur(5px)",
          }}
          animate={{
            translateY: 0,
            opacity: 1,
            filter: "blur(0px)",
          }}
          transition={{ type: "keyframes", delay: 1.5, duration: 0.3 }}
          className="m-0 flex items-center justify-center rounded-md bg-gradient-to-tr from-purple-500 via-green-500 to-violet-500 p-0.5"
        >
          {" "}
          <Button className="m-0 h-full w-full cursor-pointer rounded-md border-none p-2 px-5 text-xl font-normal backdrop-blur-md hover:text-pink-200 hover:backdrop-blur-lg">
            Let&lsquo;s Animate
          </Button>
        </motion.div>
      </a>
    </div>
  );
};
