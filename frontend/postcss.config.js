// BUG FIX : fichier requis pour que Vite puisse invoquer Tailwind CSS
// pendant le build (npm run build). Sans ce fichier, @tailwind directives
// dans index.css ne sont pas transformées → styles absents en production.
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
