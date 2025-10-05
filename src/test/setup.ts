// This setup module runs before every Vitest test file so we can configure global helpers in one place.
// The main reason we import `@testing-library/jest-dom` here is to teach Vitest about custom matchers
// like `toBeInTheDocument`, which improve the readability of our assertions and keep tests focused on UX.
import '@testing-library/jest-dom'
