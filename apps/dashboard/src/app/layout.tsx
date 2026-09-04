import type { Metadata } from "next";
import "./globals.css";
import { AICopilotDrawer } from "@/components/AICopilotDrawer";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "India Airfare Price Observatory | Ministry of Statistics & Programme Implementation (MoSPI)",
  description: "Official High-Frequency Airfare Price Index & Aviation Intelligence Platform (MoSPI / NSO)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-canvas text-ink font-sans antialiased selection:bg-ink-soft selection:text-paper min-h-screen flex flex-col">
        <Navbar />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        <AICopilotDrawer />

        <footer className="border-t border-hairline bg-paper py-6 text-xs font-mono text-mid-gray">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-ink">Airfare Price Observatory</span>
              <span className="text-mid-gray">·</span>
              <span>MoSPI Airfare Index Framework</span>
            </div>
            <div className="text-mid-gray text-[11px]">
              DGCA Passenger-Weighted Basket (2026_V1) · Anchor: T+15 Days · Baseline: 2026-08-01 = 100.00
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

