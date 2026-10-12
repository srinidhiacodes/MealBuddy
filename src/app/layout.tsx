import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "MealBuddy",
  description: "Plan a week of simple, healthy home meals from your own recipes.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="flex min-h-screen flex-wrap">
          <Sidebar />
          <main className="min-w-0 flex-[999_1_560px] px-6 py-8 sm:px-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
