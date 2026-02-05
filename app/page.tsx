import { SvgGenerator } from "@/components/SvgGenerator";
import { SEOContent } from "@/components/SEOContent";
import { Header } from "@/components/Header";
import { AdUnit } from "@/components/AdUnit";
import { ExampleGallery } from "@/components/ExampleGallery";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30">
      <Header />
      
      {/* 🎉 High Ankur Poster - For Fun! 🎉 */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 py-16 my-8 mx-4 rounded-3xl shadow-2xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSI0Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="relative text-center">
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white drop-shadow-[0_5px_30px_rgba(0,0,0,0.3)] tracking-tight animate-pulse">
            🙌 High Ankur! 🙌
          </h1>
          <p className="mt-4 text-xl md:text-2xl text-white/90 font-medium">
            ✨ You're awesome! Keep vibing! ✨
          </p>
          <div className="mt-6 flex justify-center gap-4 text-4xl animate-bounce">
            <span>🎈</span>
            <span>🎊</span>
            <span>🚀</span>
            <span>⭐</span>
            <span>🎈</span>
          </div>
        </div>
      </div>

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
