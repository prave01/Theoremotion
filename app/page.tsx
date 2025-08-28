import { Pacifico } from "next/font/google";

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: ["400"],
});

export default function Home() {
  return (
    <div className="relative min-h-screen w-full bg-black">
      <div
        className="absolute inset-0 -top-10 z-0"
        style={{
          background: `
          radial-gradient(ellipse 120% 80% at 70% 20%, rgba(255, 20, 147, 0.15), transparent 50%),
          radial-gradient(ellipse 100% 60% at 30% 10%, rgba(0, 255, 255, 0.12), transparent 60%),
          radial-gradient(ellipse 90% 70% at 50% 0%, rgba(138, 43, 226, 0.18), transparent 65%),
          radial-gradient(ellipse 110% 50% at 80% 30%, rgba(255, 215, 0, 0.08), transparent 40%),
          #000000
        `,
        }}
      />
      <div className="relative z-10 flex h-screen w-full flex-col items-center justify-center text-4xl font-semibold text-white">
        <div className="flex h-auto w-auto flex-col gap-y-4 text-center">
          {" "}
          <span
            className={`${pacifico.className} bg-gradient-to-tr from-white/80 to-purple-400 bg-clip-text text-center text-7xl text-transparent`}
          >
            Theoremotion
          </span>
          <span className="text-2xl font-medium text-white/80">
            Take your thoughts to animations in seconds with AI
          </span>
        </div>
      </div>
      <div className="">
        <span className="text-xl text-amber-50">
          Create animations with LLM
        </span>
      </div>
    </div>
  );
}
