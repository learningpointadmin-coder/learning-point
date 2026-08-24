import type { Metadata } from "next";
import "@/styles/globals.css";
import { Navbar } from "@/components/navbar";
import { LanguageProvider } from "@/components/language-provider";

export const metadata: Metadata = {
  title: "Learning Point — Master Your Exam",
  description:
    "Exam-focused test series, syllabus-grounded questions, deep-approved explanations and real ranks. Built for serious aspirants.",
  keywords: [
    "UPSSSC", "agriculture exam", "competitive exams", "test series", "mock test", "UP exams",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <LanguageProvider>
          <Navbar />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
