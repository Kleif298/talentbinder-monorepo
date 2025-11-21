import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string;
}

/**
 * Custom render function that wraps components with necessary providers
 * @param ui - The component to render
 * @param options - Additional render options
 */
export function renderWithRouter(
  ui: ReactElement,
  { initialRoute = '/', ...renderOptions }: CustomRenderOptions = {}
) {
  window.history.pushState({}, 'Test page', initialRoute);

  function Wrapper({ children }: { children: React.ReactNode }) {
    return <BrowserRouter>{children}</BrowserRouter>;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { renderWithRouter as render };
