# Contributing to GUD RMIS

Thank you for your interest in contributing to GUD RMIS!

## How to Contribute

### Reporting Bugs

Open an issue describing:
- Steps to reproduce the problem
- Expected behaviour
- Actual behaviour
- Screenshots or error logs if available

### Suggesting Features

Open an issue with the label `enhancement` and describe:
- The problem you are trying to solve
- Your proposed solution
- Any alternatives you have considered

### Submitting Pull Requests

1. **Fork** the repository and create a feature branch from `main`:
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Install** dependencies:
   ```bash
   npm install
   ```

3. **Make** your changes, following the code style of existing files.

4. **Test** your changes:
   ```bash
   npm test
   npm run lint
   npm run build
   ```

5. **Commit** using clear, descriptive messages:
   ```
   feat: add CSV export to vehicles page
   fix: handle empty driver name in loads table
   ```

6. **Push** your branch and open a Pull Request against `main`.

## Code Style

- JavaScript (ES modules), no TypeScript required.
- Follow existing patterns in `app/`, `components/`, and `lib/`.
- Use Tailwind CSS utility classes for styling.
- Ensure all form inputs have `id` and a matching `htmlFor` on `<label>`.
- Add `aria-label` to icon buttons and actionable table cells.

## Testing

- Add or update tests in `__tests__/` for any changed utility functions.
- Run `npm test` before submitting.

## Environment Variables

Never commit `.env.local` or real Firebase credentials. Use `.env.local.example` as a template and document any new variables there.

## Questions

Open an issue or start a discussion in the repository.
