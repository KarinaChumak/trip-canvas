import { AccessGate } from './features/access/AccessGate';
import { Channel } from './features/channel/Channel';

export default function App() {
  return (
    <AccessGate>
      <Channel />
    </AccessGate>
  );
}
