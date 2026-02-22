import { SvgGenerator } from "@/components/SvgGenerator";
import { SEOContent } from "@/components/SEOContent";
import { Header } from "@/components/Header";
import { AnkurEasterEgg } from "@/components/AnkurEasterEgg";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30">
      <Header />
      <AnkurEasterEgg />
      <SvgGenerator />
      <SEOContent />
    </div>
  );
}
