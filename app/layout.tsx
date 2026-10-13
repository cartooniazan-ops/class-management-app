import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Classroom | Class Management",
  description: "A secure workspace for teachers, students, class representatives and administrators.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
