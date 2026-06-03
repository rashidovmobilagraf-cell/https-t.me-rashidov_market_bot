import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import App from './src/App.jsx';

try {
  const html = renderToString(
    <StaticRouter location="/">
      <App />
    </StaticRouter>
  );
  console.log("Rendered successfully");
} catch (e) {
  console.error("Render failed:", e);
}
