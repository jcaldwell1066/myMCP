declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidGameState(): R;
    }
  }
}

export {}; 