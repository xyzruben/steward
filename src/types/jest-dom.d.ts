import '@testing-library/jest-dom'

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toHaveAttribute(attr: string, value?: string): R
      toBeDisabled(): R
      toBeEnabled(): R
      toHaveClass(...classNames: string[]): R
      toHaveTextContent(text: string | RegExp): R
      toHaveValue(value: string | string[] | number): R
    }
  }
}

export {} 