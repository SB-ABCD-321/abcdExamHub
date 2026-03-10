import Link from "next/link";
import { MoveLeft, HelpCircle, Home, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 font-sans">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.05),transparent)] z-0" />

            <div className="relative z-10 max-w-2xl w-full text-center space-y-12">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md mb-8">
                        <Rocket className="w-4 h-4 text-primary animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Trajectory Deviation</span>
                    </div>

                    <h1 className="text-[12rem] font-black tracking-tighter text-white leading-none opacity-10 italic">
                        404
                    </h1>

                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase leading-none mt-[-4rem]">
                        Mission <span className="text-primary italic">Diverted</span>
                    </h2>

                    <p className="text-xl text-zinc-500 font-medium italic max-w-lg mx-auto leading-relaxed">
                        The coordinates you requested do not exist in the current assessment mission database.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/">
                        <Button size="lg" className="h-16 px-10 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-primary/20 group">
                            <Home className="mr-2 w-4 h-4" /> Return Home
                        </Button>
                    </Link>
                    <Link href="/support">
                        <Button size="lg" variant="outline" className="h-16 px-10 border-white/10 text-white hover:bg-white/5 font-black uppercase tracking-widest rounded-2xl backdrop-blur-md group">
                            <HelpCircle className="mr-2 w-4 h-4" /> Support Ops
                        </Button>
                    </Link>
                </div>

                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-600">
                    System Secured • ABCD Intelligence Core
                </p>
            </div>
        </div>
    );
}
