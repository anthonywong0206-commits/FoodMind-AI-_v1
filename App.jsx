@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #30251E;
  background: #fff7e8;
}

* { box-sizing: border-box; }
body { margin: 0; min-height: 100vh; }
button, input, textarea, select { font: inherit; }

.food-bg {
  background:
    radial-gradient(circle at 10% 10%, rgba(249, 115, 22, .18), transparent 30%),
    radial-gradient(circle at 90% 0%, rgba(143, 174, 139, .24), transparent 28%),
    linear-gradient(145deg, #fffaf0 0%, #fff2dc 42%, #f7efe1 100%);
}

.glass {
  background: rgba(255,255,255,.72);
  backdrop-filter: blur(18px);
  border: 1px solid rgba(255,255,255,.72);
}

.card-hover { transition: transform .25s ease, box-shadow .25s ease; }
.card-hover:hover { transform: translateY(-3px); box-shadow: 0 20px 60px rgba(72,45,22,.16); }

.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
