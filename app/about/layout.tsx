import { Metadata } from 'next';
import { AboutLayoutClient } from '@/components/about/AboutLayoutClient';

export const metadata: Metadata = {
  title: 'About Oxiv Protocol — Architecture, Platforms & FAQ',
  description: 'High-precision, watermark-free, open media parser and streaming downloader for social platforms.',
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <AboutLayoutClient>{children}</AboutLayoutClient>;
}
