import { SvgGenerator } from "@/components/SvgGenerator";
import { SEOContent } from "@/components/SEOContent";
import { Header } from "@/components/Header";
import { AnkurEasterEgg } from "@/components/AnkurEasterEgg";
import { AdsterraBanner } from "@/components/AdsterraBanner";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30">
      <Header />
      <AnkurEasterEgg />
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-8 px-4">
        <div className="min-w-0">
          <SvgGenerator />
          <SEOContent />
        </div>
        <aside className="hidden xl:block pt-8">
          <div className="sticky top-24 bg-zinc-900/10 rounded-lg overflow-hidden flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-wider text-zinc-600 my-2">Advertisement</span>
            <AdsterraBanner placementKey="66eba5152f840b4521e5c99027523332" width={160} height={600} />
          </div>
        </aside>
      </div>
    </div>
  );
}
