# Test Suite

Comprehensive unit tests for the TestFixer core library.

## Running Tests

```bash
# Run all tests
npm test

# Watch mode (for development)
npm run test:watch

# Coverage report
npm run test:coverage

# Verbose output
npm run test:verbose
```

## Test Structure

```
__tests__/
├── setup.ts                    # Global test configuration
├── models.test.ts              # Data model tests
├── services/
│   ├── TestAnalyzer.test.ts    # Test failure analysis
│   └── FixGenerator.test.ts    # Fix generation logic
├── strategies/
│   ├── SnapshotFixStrategy.test.ts
│   └── AssertionFixStrategy.test.ts
└── integrations/
    └── GitHubClient.test.ts    # GitHub API integration
```

## Test Coverage

Current coverage (47 tests):

- **Models**: 100% - All data structures validated
- **Services**:
  - TestAnalyzer: Detects all 6 failure types
  - FixGenerator: Strategy registration and orchestration
  - PRCreator: Not yet tested (add next)
- **Strategies**:
  - Snapshot: 100% coverage
  - Assertion: 100% coverage
  - AI Strategy: Not yet tested (requires OpenAI mock)
- **Integrations**:
  - GitHub: Core operations tested
  - CircleCI: Not yet tested (add next)
  - OpenAI: Not yet tested (add next)

## Writing New Tests

### Example Test Structure

```typescript
import { YourClass } from '../path/to/YourClass';

describe('YourClass', () => {
  let instance: YourClass;

  beforeEach(() => {
    instance = new YourClass();
  });

  describe('methodName', () => {
    it('should do something', () => {
      const result = instance.methodName();
      expect(result).toBe(expected);
    });
  });
});
```

### Mocking External Dependencies

Fetch is already mocked globally in [setup.ts](setup.ts). For other mocks:

```typescript
const mockClient = {
  method: jest.fn().mockResolvedValue(result)
};
```

## Debugging Tests

Run with DEBUG flag to see console output:

```bash
DEBUG=1 npm test
```
