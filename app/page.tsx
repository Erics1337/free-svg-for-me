import { SvgGenerator } from "@/components/SvgGenerator";
import { SEOContent } from "@/components/SEOContent";
import { Header } from "@/components/Header";
import { AdUnit } from "@/components/AdUnit";
import { ExampleGallery } from "@/components/ExampleGallery";
import { AnkurEasterEgg } from "@/components/AnkurEasterEgg";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30">
      <Header />
      <AnkurEasterEgg />
      <SvgGenerator />
      
      {/* AdSense Unit - Middle Section */}
      <div className="container mx-auto px-4 my-12 max-w-5xl">
         <AdUnit 
           slot="2237309115" // Page Middle
           className="w-full min-h-[100px] flex justify-center bg-zinc-900/30 rounded-lg overflow-hidden"
         />
      </div>

      <ExampleGallery />
      <SEOContent />
    </div>
  );
}
