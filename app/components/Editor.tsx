import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Editor = (props: {}) => {
  return (
    <div
      id="editor"
      className="flex h-screen w-full items-center justify-center bg-black"
    >
      <div className="flex h-auto w-auto flex-col items-center justify-center gap-y-4">
        {" "}
        <div className="h-auto rounded-xl border-t-1 border-l-1 border-zinc-500/50 bg-gradient-to-tl from-green-200 via-transparent to-transparent p-0.5">
          <Textarea
            placeholder="Prompts goes here ..."
            className="relative z-10 flex min-h-13 w-3xl items-center justify-start rounded-xl border-zinc-200 bg-gradient-to-tl from-black via-black to-black pt-4 pl-5 text-lg font-normal shadow-amber-50 placeholder:text-zinc-400"
          />
        </div>
        <Button className="text-whit cursor-pointer text-sm hover:text-orange-300">
          Start animate
        </Button>
      </div>
    </div>
  );
};
