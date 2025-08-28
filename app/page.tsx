import { Editor } from "./components/Editor";
import { HeroSection } from "./components/HeroSection";

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
      <div className="relative z-10 flex h-full flex-col text-4xl font-semibold text-white">
        <HeroSection />
        <Editor />
      </div>
    </div>
  );
}
