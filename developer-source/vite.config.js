import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const pages = [
  'index',
  'shop',
  'product',
  'categories',
  'cart',
  'checkout',
  'favorites',
  'about',
  'gallery',
  'faq',
  'contact',
  'account',
  'shipping',
  'returns',
  'privacy',
  'terms',
];

const input = Object.fromEntries(
  pages.map((page) => [page, resolve(process.cwd(), `${page}.html`)]),
);


export default defineConfig({
  appType: 'mpa',
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    minify: 'esbuild',
    rollupOptions: { input },
  },
});
