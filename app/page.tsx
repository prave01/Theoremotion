export default function Home() {
  return (
    <div className="min-h-screen w-full relative bg-black">
      <div
        className="absolute inset-0 z-0 -top-10"
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
      <div className="text-4xl w-full relative z-10 flex-col text-white h-screen font-semibold flex items-center justify-center">
        <div className="w-auto h-auto text-center  flex flex-col gap-y-4">
          {" "}
          <span className="text-center text-7xl bg-gradient-to-tr from-white/80 to-purple-400 text-transparent bg-clip-text">
            Theoremotion
          </span>
          <span className="text-white font-medium text-3xl">
            Take your thoughts to animations
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
