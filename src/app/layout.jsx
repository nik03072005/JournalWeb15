import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Philosopher } from 'next/font/google';

const philosopher = Philosopher({
  subsets: ['latin'],
  weight: ['400', '700'], // include weights you need
  display: 'swap',
  variable: '--font-philosopher', // use CSS variable for Tailwind
});

export const metadata = {
  title: "Digital Library -  Vidya Bharati International School, Tinsukia",
  description: " Discover a vast collection of eBooks, journals, research papers & more. Access knowledge anytime, anywhere with our Digital Library",
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
       <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Philosopher:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
         
      >
        {children}
        {/* <Footer/> */}
      </body>
    </html>
  );
}
