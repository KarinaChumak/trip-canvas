import { Component, type ErrorInfo, type ReactNode } from 'react';
import { FallbackBlock } from './FallbackBlock';

type BlockErrorBoundaryProps = {
  /** The component type, for the fallback's title. */
  type: string;
  children: ReactNode;
};

type BlockErrorBoundaryState = { failed: boolean };

/**
 * Catches a component that throws while rendering (MapLibre without WebGL, a lazy chunk
 * that fails to load, props the component didn't expect), so only that block shows a
 * fallback and the rest of the chat stays. React only offers this as a class component.
 */
export class BlockErrorBoundary extends Component<BlockErrorBoundaryProps, BlockErrorBoundaryState> {
  state: BlockErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): BlockErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[block] ${this.props.type} failed to render`, error, info.componentStack);
  }

  render() {
    if (this.state.failed) return <FallbackBlock type={this.props.type} reason="failed" />;
    return this.props.children;
  }
}
