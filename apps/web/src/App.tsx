import { useEffect, useState } from 'react';

export default function App() {
  const [server, setServer] = useState<'checking' | 'up' | 'down'>('checking');

  useEffect(() => {
    fetch('/api/health')
      .then((r) => setServer(r.ok ? 'up' : 'down'))
      .catch(() => setServer('down'));
  }, []);

  return (
    <main className="canvas">
      <h1>Trip canvas</h1>
      <p>Server: {server}</p>
    </main>
  );
}
